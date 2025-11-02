import { useEffect, useState, useCallback } from 'react';
import { socketService } from '@/lib/socket-service';

export function useRealTimeMetrics(projectId) {
  const [metrics, setMetrics] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Connect to socket
    socketService.connect();
    setIsConnected(socketService.isConnected());

    // Handle connection status
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (err) => setError(err);

    socketService.on('connection_established', handleConnect);
    socketService.on('connection_lost', handleDisconnect);
    socketService.on('socket_error', handleError);

    // Subscribe to metrics
    if (projectId) {
      socketService.subscribeToMetrics(projectId, (data) => {
        setMetrics(data);
        setError(null);
      });
    }

    // Cleanup
    return () => {
      if (projectId) {
        socketService.unsubscribeFromMetrics(projectId, (data) => setMetrics(data));
      }
      socketService.off('connection_established', handleConnect);
      socketService.off('connection_lost', handleDisconnect);
      socketService.off('socket_error', handleError);
    };
  }, [projectId]);

  return { metrics, isConnected, error };
}

export function useRealTimeLogs(deploymentId) {
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    socketService.connect();
    setIsConnected(socketService.isConnected());

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (err) => setError(err);

    socketService.on('connection_established', handleConnect);
    socketService.on('connection_lost', handleDisconnect);
    socketService.on('socket_error', handleError);

    if (deploymentId) {
      socketService.subscribeTo Logs(deploymentId, (logEntry) => {
        setLogs((prev) => [logEntry, ...prev].slice(0, 1000));
        setError(null);
      });
    }

    return () => {
      if (deploymentId) {
        socketService.unsubscribeFromLogs(deploymentId, (logEntry) => {
          setLogs((prev) => [logEntry, ...prev].slice(0, 1000));
        });
      }
      socketService.off('connection_established', handleConnect);
      socketService.off('connection_lost', handleDisconnect);
      socketService.off('socket_error', handleError);
    };
  }, [deploymentId]);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { logs, isConnected, error, clearLogs };
}

export function useRealTimeAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    socketService.connect();
    setIsConnected(socketService.isConnected());

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (err) => setError(err);

    socketService.on('connection_established', handleConnect);
    socketService.on('connection_lost', handleDisconnect);
    socketService.on('socket_error', handleError);

    socketService.subscribeToAlerts((alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 100));
      setError(null);
    });

    return () => {
      socketService.unsubscribeFromAlerts((alert) => {
        setAlerts((prev) => [alert, ...prev].slice(0, 100));
      });
      socketService.off('connection_established', handleConnect);
      socketService.off('connection_lost', handleDisconnect);
      socketService.off('socket_error', handleError);
    };
  }, []);

  const acknowledgeAlert = useCallback((alertId) => {
    socketService.emit('acknowledge_alert', { alertId });
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  return { alerts, isConnected, error, acknowledgeAlert };
}

export function useRealTimeDeployments() {
  const [deployments, setDeployments] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    socketService.connect();
    setIsConnected(socketService.isConnected());

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (err) => setError(err);

    socketService.on('connection_established', handleConnect);
    socketService.on('connection_lost', handleDisconnect);
    socketService.on('socket_error', handleError);

    socketService.subscribeToDeployments((deployment) => {
      setDeployments((prev) => {
        const updated = [...prev];
        const index = updated.findIndex((d) => d.id === deployment.id);
        if (index > -1) {
          updated[index] = deployment;
        } else {
          updated.unshift(deployment);
        }
        return updated.slice(0, 50);
      });
      setError(null);
    });

    return () => {
      socketService.unsubscribeFromDeployments((deployment) => {
        setDeployments((prev) => {
          const updated = [...prev];
          const index = updated.findIndex((d) => d.id === deployment.id);
          if (index > -1) {
            updated[index] = deployment;
          } else {
            updated.unshift(deployment);
          }
          return updated.slice(0, 50);
        });
      });
      socketService.off('connection_established', handleConnect);
      socketService.off('connection_lost', handleDisconnect);
      socketService.off('socket_error', handleError);
    };
  }, []);

  return { deployments, isConnected, error };
}

export function useSystemStatus() {
  const [status, setStatus] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    socketService.connect();
    setIsConnected(socketService.isConnected());

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (err) => setError(err);

    socketService.on('connection_established', handleConnect);
    socketService.on('connection_lost', handleDisconnect);
    socketService.on('socket_error', handleError);

    socketService.subscribeToSystemStatus((systemStatus) => {
      setStatus(systemStatus);
      setError(null);
    });

    return () => {
      socketService.unsubscribeFromSystemStatus((systemStatus) => {
        setStatus(systemStatus);
      });
      socketService.off('connection_established', handleConnect);
      socketService.off('connection_lost', handleDisconnect);
      socketService.off('socket_error', handleError);
    };
  }, []);

  return { status, isConnected, error };
}
