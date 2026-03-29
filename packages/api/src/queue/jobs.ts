import { Queue } from 'bullmq'
import { redisConnection } from './client.js'

export interface VideoProcessingJobData {
  matchId: string
  videoChave: string
}

export const videoQueue = new Queue<VideoProcessingJobData>('video-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60_000, // 1 minute base delay
    },
    removeOnComplete: {
      age: 86_400, // Keep for 24h after completion
    },
    removeOnFail: {
      age: 604_800, // Keep for 7 days after failure
    },
  },
})

export async function addVideoProcessingJob(data: VideoProcessingJobData) {
  return videoQueue.add('video.process', data, {
    priority: 1,
    jobId: `match-${data.matchId}`, // Prevent duplicate jobs for same match
  })
}

export async function getJobStatus(matchId: string) {
  const job = await videoQueue.getJob(`match-${matchId}`)
  if (!job) return null

  const state = await job.getState()
  const progress = job.progress

  return {
    jobId: job.id,
    state,
    progress,
    failedReason: job.failedReason,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  }
}
