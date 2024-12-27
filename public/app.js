let bluetoothDevice;
let characteristicCache = null;

// 在文件开头添加蓝牙支持检查
function isWebBluetoothSupported() {
  if (!navigator.bluetooth) {
    console.error('Web Bluetooth API 不可用');
    return false;
  }
  return true;
}

async function connectToBluetoothDevice() {
  if (!isWebBluetoothSupported()) {
    console.error('详细信息:', {
      bluetooth: !!navigator.bluetooth,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    });
    const statusElement = document.getElementById('status');
    statusElement.textContent = '状态: 您的浏览器不支持 Web Bluetooth';
    statusElement.style.color = 'red';
    alert('您的浏览器不支持蓝牙功能！请使用 Chrome、Edge 或其他支持 Web Bluetooth 的浏览器。');
    return;
  }

  try {
    // 请求蓝牙设备
    bluetoothDevice = await navigator.bluetooth.requestDevice({
      // 可以根据需要修改过滤条件
      acceptAllDevices: true,
      optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'] // 使用标准的 UART 服务 UUID
    });

    const statusElement = document.getElementById('status');
    statusElement.textContent = `状态: 已连接到 ${bluetoothDevice.name}`;

    // 监听设备断开连接
    bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);

    // 连接到 GATT 服务器
    const server = await bluetoothDevice.gatt.connect();
    console.log('已连接到 GATT 服务器');

    // 获取 UART 服务
    const service = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');

    // 获取特征值
    characteristicCache = await service.getCharacteristic('6e400002-b5a3-f393-e0a9-e50e24dcca9e');
    const rxCharacteristic = await service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e');

    // 启用消息接收通知
    await rxCharacteristic.startNotifications();
    rxCharacteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

    // 显示消息发送区域
    document.getElementById('messageArea').style.display = 'block';

  } catch (error) {
    console.error('详细错误信息:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    alert(`连接蓝牙设备时出错: ${error.message}\n请确保：\n1. 已开启蓝牙\n2. 已开启位置服务\n3. 已授予位置权限`);
  }
}

function onDisconnected() {
  const statusElement = document.getElementById('status');
  statusElement.textContent = '状态: 设备已断开连接';
  document.getElementById('messageArea').style.display = 'none';
  characteristicCache = null;
}

// 处理接收到的消息
function handleCharacteristicValueChanged(event) {
  const value = event.target.value;
  const decoder = new TextDecoder();
  const message = decoder.decode(value);

  const messagesDiv = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.textContent = `收到: ${message}`;
  messagesDiv.appendChild(messageElement);
}

// 发送消息
async function sendMessage(message) {
  if (!characteristicCache) {
    alert('请先连接蓝牙设备');
    return;
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    await characteristicCache.writeValue(data);

    const messagesDiv = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.textContent = `发送: ${message}`;
    messagesDiv.appendChild(messageElement);
  } catch (error) {
    console.error('发送消息失败:', error);
    alert('发送消息失败: ' + error);
  }
}

// 添加事件监听
document.getElementById('connectBtn').addEventListener('click', connectToBluetoothDevice);
document.getElementById('sendBtn').addEventListener('click', () => {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();
  if (message) {
    sendMessage(message);
    messageInput.value = '';
  }
}); 