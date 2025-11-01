const MediaAsset = require('../models/MediaAsset');
const sharp = require('sharp');
const { Storage } = require('@google-cloud/storage');
const { CloudFront } = require('aws-sdk');
const fetch = require('node-fetch');
const path = require('path');

class MediaCDNService {
  constructor() {
    this.storage = new Storage();
    this.cloudfront = new CloudFront();
    this.bucket = this.storage.bucket(process.env.CDN_BUCKET_NAME);
  }

  async uploadAsset(file, settings) {
    const fileName = `${Date.now()}-${path.basename(file.originalname)}`;
    const asset = new MediaAsset({
      name: fileName,
      type: file.mimetype,
      size: file.size,
      originalUrl: `${process.env.CDN_BASE_URL}/${fileName}`,
      cdnUrl: `${process.env.CDN_BASE_URL}/${fileName}`,
      ...settings,
    });

    try {
      // Upload to cloud storage
      const blob = this.bucket.file(fileName);
      const blobStream = blob.createWriteStream();
      await new Promise((resolve, reject) => {
        blobStream.on('finish', resolve);
        blobStream.on('error', reject);
        blobStream.end(file.buffer);
      });

      // Update asset status
      asset.status = 'active';
      await asset.save();

      return asset;
    } catch (error) {
      asset.status = 'error';
      await asset.save();
      throw error;
    }
  }

  async optimizeAsset(id, settings) {
    const asset = await MediaAsset.findById(id);
    if (!asset) {
      throw new Error('Asset not found');
    }

    try {
      const response = await fetch(asset.originalUrl);
      const buffer = await response.buffer();

      let optimizedBuffer;
      if (asset.type.startsWith('image/')) {
        // Image optimization
        let sharpInstance = sharp(buffer);
        
        switch (settings.compressionLevel) {
          case 'low':
            sharpInstance = sharpInstance.jpeg({ quality: 80 });
            break;
          case 'medium':
            sharpInstance = sharpInstance.jpeg({ quality: 60 });
            break;
          case 'high':
            sharpInstance = sharpInstance.jpeg({ quality: 40 });
            break;
        }

        optimizedBuffer = await sharpInstance.toBuffer();
      } else if (asset.type.startsWith('video/')) {
        // Video optimization would go here
        // This would typically involve using ffmpeg or a video processing service
        optimizedBuffer = buffer;
      }

      // Upload optimized version
      const optimizedFileName = `optimized-${asset.name}`;
      const blob = this.bucket.file(optimizedFileName);
      await blob.save(optimizedBuffer, {
        metadata: {
          cacheControl: settings.cacheControl,
          contentType: asset.type,
        },
      });

      // Update asset
      asset.size = optimizedBuffer.length;
      asset.cdnUrl = `${process.env.CDN_BASE_URL}/${optimizedFileName}`;
      await asset.optimize(settings);

      return asset;
    } catch (error) {
      console.error('Optimization failed:', error);
      throw error;
    }
  }

  async purgeCache(id) {
    const asset = await MediaAsset.findById(id);
    if (!asset) {
      throw new Error('Asset not found');
    }

    try {
      // Create CloudFront invalidation
      await this.cloudfront.createInvalidation({
        DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: `purge-${id}-${Date.now()}`,
          Paths: {
            Quantity: 1,
            Items: [asset.cdnUrl],
          },
        },
      }).promise();

      await asset.purgeCache();
      return asset;
    } catch (error) {
      console.error('Cache purge failed:', error);
      throw error;
    }
  }

  async listAssets() {
    return MediaAsset.find().sort({ createdAt: -1 });
  }

  async getAsset(id) {
    return MediaAsset.findById(id);
  }

  async deleteAsset(id) {
    const asset = await MediaAsset.findById(id);
    if (!asset) {
      throw new Error('Asset not found');
    }

    try {
      // Delete from cloud storage
      const file = this.bucket.file(asset.name);
      await file.delete();

      // Delete from database
      await asset.delete();
    } catch (error) {
      console.error('Asset deletion failed:', error);
      throw error;
    }
  }
}

module.exports = new MediaCDNService();