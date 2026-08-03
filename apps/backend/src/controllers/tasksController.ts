import { Request, Response } from 'express';
import * as scheduler from '../services/scheduler.js';
import logger from '../utils/logger.js';

export const createTask = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).userId;
        const { type, frequency, time, config } = req.body;

        if (!type || !frequency || !time) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const task = await scheduler.scheduleTask(userId, type, frequency, time, config);
        res.json(task);
    } catch (error) {
        logger.error('Create task error:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
};

export const getTasks = async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).userId;
        const tasks = await scheduler.listTasks(userId);
        res.json(tasks);
    } catch (error) {
        logger.error('Get tasks error:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

export const cancelTask = async (req: Request, res: Response) => {
    try {
        const taskId = parseInt(req.params.id);
        await scheduler.deleteTask(taskId);
        res.json({ success: true });
    } catch (error) {
        logger.error('Delete task error:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
};
