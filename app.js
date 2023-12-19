const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath('/path/to/ffmpeg'); // Replace '/path/to/ffmpeg' with the actual path to the ffmpeg executable
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/download', async (req, res) => {
    try {
        console.log('Request received'); // Log statement to check if the request is reaching the server

        const videoURL = req.query.videoURL;
        const downloadType = req.query.downloadType;
        const videoResolution = req.query.videoResolution || 'highest';

        console.log('Video URL:', videoURL);
        console.log('Download Type:', downloadType);
        console.log('Video Resolution:', videoResolution);

        // Validate the YouTube URL
        if (!ytdl.validateURL(videoURL)) {
            console.error('Invalid YouTube URL:', videoURL);
            return res.send('Invalid YouTube URL');
        }

        // Log a message to check if the validation is successful
        console.log('YouTube URL is valid');

        // Get video info
        const info = await ytdl.getInfo(videoURL);

        // Log video information for debugging
        console.log('Video Information:', info);

        // Set up video format based on resolution
        const format = ytdl.chooseFormat(info.formats, { quality: videoResolution });

        // Log a message to check if the format is selected correctly
        console.log('Selected Format:', format);

        // Set up response headers
        res.header('Content-Disposition', `attachment; filename="${info.title}.${downloadType === 'audio' ? 'mp3' : 'mp4'}"`);
        res.header('Content-Type', downloadType === 'audio' ? 'audio/mpeg' : 'video/mp4');

        if (downloadType === 'audio') {
            // Log a message to check if audio conversion is starting
            console.log('Starting Audio Conversion...');

            // Set up FFmpeg for converting to MP3
            const ffmpegCommand = ffmpeg();
            ffmpegCommand.input(ytdl(videoURL, { format }));
            ffmpegCommand.audioCodec('aac'); // Use 'aac' codec for audio
            // ffmpegCommand.audioCodec('libmp3lame');
            ffmpegCommand.on('end', () => {
                console.log('Audio conversion completed');
                res.end();
            });
            ffmpegCommand.on('error', (err) => {
                console.error('Error converting to MP3:', err);
                res.send('Error converting to MP3');
            });
            // Pipe the FFmpeg command to the response
            ffmpegCommand.pipe(res, { end: true });
        } else {
            // Log a message to check if video download is starting
            console.log('Starting Video Download...');

            // Pipe the video stream to the response
            ytdl(videoURL, { format }).pipe(res);
            console.log('Video Downloaded...');

        }
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
