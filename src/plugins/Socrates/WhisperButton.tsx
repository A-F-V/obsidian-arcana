/*
A voice record button that uses OpenAI's Whispher model
*/
import React, { useState, useEffect } from 'react';
import { useArcana } from 'src/hooks/hooks';

class Recorder {
  gumStream: MediaStream | null; //stream from getUserMedia()
  recorder: MediaRecorder | null; //MediaRecorder object
  chunks: BlobPart[] = []; //Array of chunks of audio data from the browser
  extension: string | null;
  fileWriter: (data: ArrayBuffer) => Promise<void>;

  constructor(fileWriter: (data: ArrayBuffer) => Promise<void>) {
    this.gumStream = null;
    this.recorder = null;
    this.chunks = [];
    this.extension = null;
    this.fileWriter = fileWriter;
  }

  async beginRecording() {
    //URL = window.URL || window.webkitURL;

    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      this.extension = 'webm';
    } else {
      // TODO:
      // Raise a warning
    }

    const constraints = { audio: true, video: false };

    /*
				  We're using the standard promise based getUserMedia()
				  https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
			  */

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream: MediaStream) => {
        console.log(
          'getUserMedia() success, stream created, initializing MediaRecorder'
        );

        /*  assign to gumStream for later use  */
        this.gumStream = stream;

        const options = {
          audioBitsPerSecond: 256000,
          videoBitsPerSecond: 2500000,
          bitsPerSecond: 2628000,
          mimeType: 'audio/' + this.extension + ';codecs=opus',
        };

        //update the format
        // document.getElementById("formats").innerHTML =
        //   "Sample rate: 48kHz, MIME: audio/" + extension + ";codecs=opus";

        /*
					  Create the MediaRecorder object
				  */
        this.recorder = new MediaRecorder(stream, options);
        console.log('recorder is now a MediaRecorder object');

        //when data becomes available add it to our array of audio data
        this.recorder.ondataavailable = (e: BlobEvent) => {
          console.log('recorder.ondataavailable:' + e.data);

          console.log(
            'recorder.audioBitsPerSecond:' + this.recorder?.audioBitsPerSecond
          );
          // console.log("recorder.bitsPerSecond:" + recorder.bitsPerSecond);
          // add stream data to chunks
          this.chunks.push(e.data);
          // if recorder is 'inactive' then recording has finished
          if (this.recorder?.state == 'inactive') {
            // convert stream data chunks to a 'webm' audio format as a blob
            const blob = new Blob(this.chunks, {
              type: 'audio/' + this.extension,
            });
            this.createAudioFile(blob);
          }
        };

        this.recorder.onerror = console.log;

        //start recording using 1 second chunks
        //Chrome and Firefox will record one long chunk if you do not specify the chunck length
        this.recorder.start(1000);

        //recorder.start();
        //   recorder = null;
        //   blob = null;
        this.chunks = [];
      })
      .catch(function (err) {
        //enable the record button if getUserMedia() fails
        console.log(err);
        console.log(
          'getUserMedia() failed. Please check your browser settings.'
        );
      });
  }
  async stopRecording() {
    this.recorder?.stop();
    //stop microphone access
    this.gumStream?.getAudioTracks()[0].stop();
  }
  async createAudioFile(blob: Blob) {
    blob.arrayBuffer().then(data => {
      console.log(data);
      this.fileWriter(data);
    });
  }
}

export default function WhisperButton() {
  // A stylish button that goes red when pressed
  const [recording, setRecording] = useState(false);
  const arcana = useArcana();

  const recorder = new Recorder(async (data: ArrayBuffer) => {
    await arcana.app.vault.createBinary('/test.webm', data);
  });

  const beginRecording = () => {
    recorder.beginRecording();
  };

  const endRecording = () => {
    recorder.stopRecording();
  };

  useEffect(() => {
    if (recording) {
      beginRecording();
    } else {
      endRecording();
    }
  }, [recording]);

  return (
    <div>
      <button
        onClick={() => setRecording(!recording)}
        style={{
          backgroundColor: recording ? 'red' : 'blue',
          color: 'white',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          fontSize: '20px',
          fontWeight: 'bold',
          border: 'none',
        }}
      >
        {recording ? '🎙️' : '🎤'}
      </button>
    </div>
  );
}
