/*
A voice record button that uses OpenAI's Whispher model
*/
import { useArcana } from '../hooks/hooks';
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';

// An enum of recording errors
export enum RecordingError {
  DOES_NOT_SUPPORT_RECORDING = 'DOES_NOT_SUPPORT_RECORDING',
  NO_MICROPHONE_FOUND = 'NO_MICROPHONE_FOUND',
  FAILED_TO_RECORD = 'FAILED_TO_RECORD',
}

class Recorder {
  gumStream: MediaStream | null; //stream from getUserMedia()
  recorder: MediaRecorder | null; //MediaRecorder object
  chunks: BlobPart[] = []; //Array of chunks of audio data from the browser
  extension: string | null;
  onFinish: (blob: Blob) => void;
  onError: (e: RecordingError) => void;

  constructor(
    onFinish: (blob: Blob) => void,
    onError: (e: RecordingError) => void
  ) {
    this.gumStream = null;
    this.recorder = null;
    this.chunks = [];
    this.extension = null;
    this.onFinish = onFinish;
    this.onError = onError;
  }

  async beginRecording() {
    //URL = window.URL || window.webkitURL;

    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      this.extension = 'webm';
    } else {
      this.onError(RecordingError.DOES_NOT_SUPPORT_RECORDING);
    }

    const constraints = { audio: true, video: false };

    /*
				  We're using the standard promise based getUserMedia()
				  https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
			  */

    const callback = ((stream: MediaStream) => {
      /*  assign to gumStream for later use  */
      this.gumStream = stream;

      const options = {
        audioBitsPerSecond: 96000, // 96kbps
        videoBitsPerSecond: 0, // No video
        bitsPerSecond: 96000,
        mimeType: 'audio/' + this.extension + ';codecs=opus',
      };

      //update the format
      // document.getElementById("formats").innerHTML =
      //   "Sample rate: 48kHz, MIME: audio/" + extension + ";codecs=opus";

      /*
					  Create the MediaRecorder object
				  */
      this.recorder = new MediaRecorder(stream, options);
      //when data becomes available add it to our array of audio data
      this.recorder.ondataavailable = (e: BlobEvent) => {
        // add stream data to chunks
        this.chunks.push(e.data);
      };
      this.recorder.onstop = ((e: Event) => {
        const blob = new Blob(this.chunks, {
          type: 'audio/' + this.extension,
        });
        this.onFinish(blob);
      }).bind(this);

      this.recorder.onerror = ((e: Event) => {
        this.onError(RecordingError.FAILED_TO_RECORD);
      }).bind(this);

      //Chrome and Firefox will record one long chunk if you do not specify the chunck length
      // Creates one long audio file (single chunck)
      this.recorder.start();

      //recorder.start();
      //   recorder = null;
      //   blob = null;
      this.chunks = [];
    }).bind(this);

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(callback)
      .catch(
        function (err: any) {
          // I think this is correct
          console.log(err);
          this.onError(RecordingError.NO_MICROPHONE_FOUND);
        }.bind(this)
      );
  }
  async stopRecording() {
    this.recorder?.stop();
    this.gumStream //stop microphone access
      ?.getAudioTracks()[0]
      .stop();
  }
}

export const MicrophoneButton = forwardRef(
  (
    {
      onRecordingEnd,
      onRecordingError,
    }: {
      onRecordingEnd: (blob: Blob) => void;
      onRecordingError: (e: RecordingError) => void;
    },
    ref // A ref to this microhpone
  ) => {
    // A stylish button that goes red when pressed
    const [recording, setRecording] = useState(false);
    // Use a ref to keep a consistent reference to the recorder across renders
    const recorderRef = useRef(new Recorder(onRecordingEnd, onRecordingError));

    useEffect(() => {
      recorderRef.current = new Recorder(onRecordingEnd, onRecordingError);
    }, [onRecordingEnd, onRecordingError]);

    const beginRecording = () => {
      recorderRef.current.beginRecording();
    };

    const endRecording = () => {
      recorderRef.current.stopRecording();
    };

    const toggleRecording = React.useCallback(() => {
      setRecording(!recording);
      console.debug('toggling recording');
    }, [recording]);

    useImperativeHandle(ref, () => ({
      toggleRecording,
    }));

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
          onClick={toggleRecording}
          className={`recording-button ${recording ? 'active' : ''}`}
        >
          {recording ? '🎙️' : '🎤'}
        </button>
      </div>
    );
  }
);

export enum TranslationError {
  FAILED_TO_TRANSLATE = 'FAILED_TO_TRANSLATE',
}

export const WhisperButton = forwardRef(
  (
    {
      onTranscription,
      onFailedTranscription,
    }: {
      onTranscription: (text: string) => void;
      onFailedTranscription: (error: TranslationError | RecordingError) => void;
    },
    ref
  ) => {
    const arcana = useArcana();
    const microphoneRef = useRef(null);

    const onRecordingEnd = useCallback(
      (blob: Blob) => {
        arcana
          .transcribe(new File([blob], 'recording.webm'))
          .then(text => {
            onTranscription(text);
          })
          .catch(error => {
            console.log(error);
            onFailedTranscription(TranslationError.FAILED_TO_TRANSLATE);
          });
      },
      [onTranscription, onFailedTranscription]
    );

    useImperativeHandle(ref, () => ({
      toggleRecording: () => {
        // @ts-ignore
        microphoneRef.current?.toggleRecording();
        // @ts-ignore
      },
    }));

    return (
      <MicrophoneButton
        ref={microphoneRef}
        onRecordingEnd={onRecordingEnd}
        onRecordingError={onFailedTranscription}
      />
    );
  }
);
