# Tiktok Bot

Ps: I'm not maintaining this project anymore so I just turned it public.

This is a Tiktok, Twitch and Coub(not implemented) downloader(video and metadata for analysis), and also it's possible to do video compilations of downloaded videos.

## Configuration and Usage

###  Starting Database from docker

You can use a PostgreSQL database, but for development purposes, there is a docker-compose.yml where you can init a database with only one command:

`cd docker && docker-compose up` to install and run database

### Relevant files and directories

- `.env_example`: Rename this to `.env` and configure like your project needs.
- `data_dir`: This directory is meant to persist all data from puppeteer chrome, like logins and cookies. It's basically a Chromium Profile directory(you can even copy from a chromium installation if you want it).

## Milestones

- [x] Docker container for database administration
- [x] Tiktok Craw
- [x] Tiktok Crawl
- [x] Tiktok Compilation Editing
  - [x] Thumbnail Editing
- [x] Web page for managing twitch clips
[ ] Web page for manage tiktok
- [] 
