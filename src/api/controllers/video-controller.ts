import { Router } from 'express';

//Types
import { Clip } from '../../Types/Clip';

//Services
import { VideoService } from '../../Services/video-service';
import { ClipService } from '../../Services/clip-service';


export const videoController = Router();

const videoService = new VideoService();

videoController.get('/:video_id', async (req, res) => {
  try {
    const video = await videoService.getVideo({video_id: parseInt(req.params['video_id']) });

    if(video) {
      res.send(video)
    } else {
      res.status(404).send("No video found");
    }
  } catch(e) {
    console.error(e);
    res.status(500).send("An error ocurred");
  }
})

videoController.post('/:video_id/clip', async (req, res) => {
  try {
    const body = req.body;

    const clip: Clip = {
      video_id: parseInt(req.params['video_id']),
      offset_seconds: parseInt(body.offset_seconds),
      duration: parseInt(body.duration)
    };

    const clipService = new ClipService();

    await clipService.createClip(clip);

    res.send(true);
  }
  catch (e) {
    console.error(e);
    res.status(500).send("An error ocurred");
  }
});

