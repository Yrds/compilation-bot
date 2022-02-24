import express, { Express, Application } from 'express';
import cors from 'cors';
import { videoController } from './controllers/video-controller';
import { clipController } from './controllers/clip-controller'; 


export class ApiServer {
  app: Application = express();

  startServer() {
    const port = 3000;
    return new Promise((resolve, reject) => {
      this.app.use(express.json());
      this.app.use(cors());
      this.registerControllers(this.app);
      this.app.listen(port, () => {
        console.log("Server runing on port " + port);
      })

      this.app.on('close', () => {
        resolve(0);
      })
    });
  }

  registerControllers(app: Application) {
    app.use('/video', videoController);
    app.use('/clip', clipController);
  }
}




