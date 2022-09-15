import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';

import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes';
import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string';

export const app = express();
app.use(express.json());
app.use(cors({}));

const prisma = new PrismaClient({
  log: ["query"],
});

app.get("/games", async (request, response) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        },
      },
    },
  });

  return response.status(200).json(games);
});

app.post("/games/:id/ads", async (request, response) => {
  const gameId = request.params.id;
  const adsBody = request.body;

  const ad = await prisma.ad.create({
    data: {
      gameId,
      name: adsBody.name,
      yearsPlaying: adsBody.yearsPlaying,
      discord: adsBody.discord,
      weekDays: adsBody.weekDays.join(","),
      hourStart: convertHourStringToMinutes(adsBody.hourStart),
      hourEnd: convertHourStringToMinutes(adsBody.hourEnd),
      useVoiceChannel: adsBody.useVoiceChannel,
    },
  });
  return response.status(201).json(ad);
});

app.get("/games/:id/ads", async (request, response) => {
  const gameId = request.params.id;

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hourStart: true,
      hourEnd: true,
    },
    where: {
      gameId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return response.status(200).json(
    ads.map((ad) => {
      return {
        ...ad,
        weekDays: ad.weekDays.split(","),
        hourStart: convertMinutesToHourString(ad.hourStart),
        hourEnd: convertMinutesToHourString(ad.hourEnd),
      };
    })
  );
});

app.get("/ads/:id/discord", async (request, response) => {
  const adId = request.params.id;

  const ad = await prisma.ad.findUniqueOrThrow({
    where: {
      id: adId,
    },
  });

  return response.status(200).json({
    discord: ad.discord,
  });
});