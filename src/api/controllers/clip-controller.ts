import { Router } from 'express';

//Types
import { Clip } from '../../Types/Clip';

//Services
import { ClipService } from '../../Services/clip-service';
import { VideoService } from '../../Services/video-service';

export const clipController = Router();

const clipService = new ClipService();

clipController.get('/:clip_id/file.mp4', async (req, res) => {
  try {
    const clipFile = await clipService.downloadClip(parseInt(req.params['clip_id'])) 

    if(clipFile) {
      res.setHeader('Content-Type', 'video/mp4');
      res.sendFile(clipFile);
    } else {
      res.status(500).send("An error ocurred");
    }
  }
  catch (e) {
    console.error(e);
    res.status(500).send("An error ocurred");
  }
});

clipController.get('/preview', async (req,res) => {
  try {
    const clip: Clip = {
      video_id: parseInt(req.query.video_id as string),
      offset_seconds: parseInt(req.query.offset_seconds as string),
      duration: parseInt(req.query.duration as string)
    };

    const clipFile = await clipService.downloadClip(clip);

    if(clipFile) {
      res.setHeader('Content-Type', 'video/mp4');
      res.sendFile(clipFile);
    } else {
      res.status(500).send("An error ocurred");
    }
  } catch (e) {
    console.log(e);
    res.status(500).send("An error ocurred");
  }
})
