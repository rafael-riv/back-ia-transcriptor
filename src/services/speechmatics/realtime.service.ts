import { RealtimeClient } from '@speechmatics/real-time-client';
import { createSpeechmaticsJWT } from '@speechmatics/auth';
import { Socket } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.API_KEY;

export class RealtimeService {
  private client: RealtimeClient;
  private socket: Socket;
  private isInitialized = false;

  constructor(socket: Socket) {
    this.client = new RealtimeClient();
    this.socket = socket;
    this.addEventListeners();
  }

  public async init() {
    if (!apiKey) {
      this.socket.emit('error', 'API_KEY not configured');
      return;
    }
    
    try {
      const jwt = await createSpeechmaticsJWT({
        type: 'rt',
        apiKey,
        ttl: 3600,
      });

      await this.client.start(jwt, {
        transcription_config: {
          language: 'es',
          enable_partials: true,
          operating_point: 'enhanced',
        },
      });
      this.isInitialized = true;
    } catch (error) {
      this.socket.emit('error', `Error initializing Speechmatics client: ${(error as Error).message}`);
    }
  }

  private addEventListeners() {
    this.client.addEventListener('receiveMessage', ({ data }) => {
      if (!this.socket) return;

      if (data.message === 'AddPartialTranscript') {
        this.socket.emit('partial_transcript', data);
      } else if (data.message === 'AddTranscript') {
        this.socket.emit('final_transcript', data);
      } else if (data.message === 'EndOfTranscript') {
        this.socket.emit('end_of_transcript');
      } else if (data.message === 'Error') {
        this.socket.emit('error', data);
      }
    });
  }

  public sendAudio(audio: Buffer) {
    if (!this.isInitialized) return;
    this.client.sendAudio(audio);
  }

  public stopRecognition() {
    if (!this.isInitialized) return;
    this.client.stopRecognition();
    this.isInitialized = false;
  }
} 