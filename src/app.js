navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    console.log({ stream });
  
    if (!MediaRecorder.isTypeSupported('audio/webm')) return alert('Browser not supported');
  
    let mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    let recordingActive = true; // Track if recording is active or not
    let audioChunks = []; // Store recorded audio chunks
    let socket;
  
    // Function to initialize WebSocket
    const initWebSocket = () => {
      socket = new WebSocket('wss://api.deepgram.com/v1/listen', [
        'token',
        '8a47dbd8155bb5c6e0ac52eb55bf622762484105',
      ]);
  
      socket.onopen = () => {
        document.querySelector('#status').textContent = 'Connected';
        document.querySelector('#status').classList.replace('bg-gray-700', 'bg-green-500');
        document.querySelector('#loader').classList.remove('hidden');
        console.log({ event: 'onopen' });
  
        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0 && socket.readyState === 1 && recordingActive) {
            socket.send(event.data);
            audioChunks.push(event.data); // Save audio chunks for playback later
          }
        });
  
        mediaRecorder.start(1000); // Restart recording every second
      };
  
      socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel.alternatives[0].transcript;
  
        if (transcript && received.is_final) {
          console.log(transcript);
          document.querySelector('#transcript').textContent += transcript + ' ';
        }
      };
  
      socket.onclose = () => {
        console.log({ event: 'onclose' });
        document.querySelector('#status').textContent = 'Disconnected';
        document.querySelector('#status').classList.replace('bg-green-500', 'bg-red-500');
        document.querySelector('#loader').classList.add('hidden');
      };
  
      socket.onerror = (error) => {
        console.log({ event: 'onerror', error });
        document.querySelector('#status').textContent = 'Error Connecting';
        document.querySelector('#status').classList.replace('bg-green-500', 'bg-red-500');
        document.querySelector('#loader').classList.add('hidden');
      };
    };
  
    initWebSocket(); // Initialize the WebSocket connection initially
  
    // Add functionality to block/unblock microphone
    document.querySelector('#toggleMic').addEventListener('click', (event) => {
      if (recordingActive) {
        mediaRecorder.stop(); // Stop recording
        socket.close(); // Close the WebSocket connection
        event.target.textContent = 'Unblock Microphone'; // Update button text
        recordingActive = false;
        console.log('Microphone blocked');
      } else {
        // Reinitialize the mediaRecorder and WebSocket
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        initWebSocket(); // Reopen the WebSocket and resume recording
        event.target.textContent = 'Block Microphone'; // Update button text
        recordingActive = true;
        console.log('Microphone unblocked');
      }
    });
  
    // Add functionality to clear transcript
    document.querySelector('#clearTranscript').addEventListener('click', () => {
      document.querySelector('#transcript').textContent = '';
    });
  });
  