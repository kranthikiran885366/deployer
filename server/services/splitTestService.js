const SplitTest = require("../models/SplitTest")

class SplitTestService {
  async getTests(projectId) {
    return await SplitTest.find({ projectId })
  }

  async createTest(testData) {
    // Validate weights sum to 100%
    const totalWeight = testData.variants.reduce((sum, v) => sum + v.weight, 0)
    if (totalWeight !== 100) {
      throw new Error("Variant weights must sum to 100%")
    }

    const test = new SplitTest(testData)
    return await test.save()
  }

  async updateTest(id, updates) {
    if (updates.variants) {
      const totalWeight = updates.variants.reduce((sum, v) => sum + v.weight, 0)
      if (totalWeight !== 100) {
        throw new Error("Variant weights must sum to 100%")
      }
    }
    return await SplitTest.findByIdAndUpdate(id, updates, { new: true })
  }

  async deleteTest(id) {
    return await SplitTest.findByIdAndDelete(id)
  }

  async updateVariantWeight(testId, variantName, weight) {
    const test = await SplitTest.findById(testId)
    if (!test) throw new Error("Test not found")

    // Find the variant to update
    const variantIndex = test.variants.findIndex(v => v.name === variantName)
    if (variantIndex === -1) throw new Error("Variant not found")

    // Calculate new weights
    const oldWeight = test.variants[variantIndex].weight
    const weightDiff = weight - oldWeight
    
    // Adjust other variants proportionally
    const otherVariants = test.variants.filter((_, i) => i !== variantIndex)
    const totalOtherWeight = otherVariants.reduce((sum, v) => sum + v.weight, 0)
    
    test.variants.forEach((variant, i) => {
      if (i === variantIndex) {
        variant.weight = weight
      } else {
        const proportion = variant.weight / totalOtherWeight
        variant.weight = Math.max(0, variant.weight - (weightDiff * proportion))
      }
    })

    return await test.save()
  }

  async recordVisit(testId, variantName) {
    const update = {
      $inc: {
        "metrics.totalVisitors": 1,
        "metrics.variantMetrics.$[variant].visitors": 1
      }
    }
    
    const options = {
      arrayFilters: [{ "variant.variantName": variantName }]
    }

    return await SplitTest.findByIdAndUpdate(testId, update, options)
  }

  async recordConversion(testId, variantName) {
    const test = await SplitTest.findById(testId)
    if (!test) throw new Error("Test not found")

    const variantMetrics = test.metrics.variantMetrics.find(
      vm => vm.variantName === variantName
    )
    if (!variantMetrics) throw new Error("Variant metrics not found")

    variantMetrics.conversions += 1
    variantMetrics.conversionRate = (
      (variantMetrics.conversions / variantMetrics.visitors) * 100
    ).toFixed(2)

    return await test.save()
  }

  async getTestMetrics(testId) {
    const test = await SplitTest.findById(testId)
    if (!test) throw new Error("Test not found")

    return {
      totalVisitors: test.metrics.totalVisitors,
      variants: test.metrics.variantMetrics
    }
  }

  selectVariant(test, userId) {
    // Use consistent hashing to assign variant
    const hash = this.hashUserId(userId)
    const normalizedHash = hash / Math.pow(2, 32) // Normalize to 0-1

    let cumulativeWeight = 0
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight / 100
      if (normalizedHash < cumulativeWeight) {
        return variant
      }
    }

    return test.variants[0] // Fallback to first variant
  }

  hashUserId(userId) {
    const crypto = require("crypto")
    const hash = crypto.createHash("md5").update(userId).digest()
    return hash.readUInt32BE(0)
  }
}

module.exports = new SplitTestService()