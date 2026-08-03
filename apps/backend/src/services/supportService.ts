import prisma from '../utils/prisma.js';

// ============================================================================
// SUPPORT TICKET CREATION (User)
// ============================================================================

interface CreateTicketParams {
    userId: number;
    title: string;
    description: string;
    source?: 'dashboard' | 'extension';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export const createTicket = async (params: CreateTicketParams) => {
    const { userId, title, description, source = 'dashboard', priority = 'MEDIUM' } = params;

    const ticket = await prisma.supportTicket.create({
        data: {
            userId,
            title,
            description,
            source,
            priority,
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    return ticket;
};

// ============================================================================
// USER TICKET RETRIEVAL
// ============================================================================

interface GetUserTicketsOptions {
    page?: number;
    limit?: number;
    status?: string;
}

export const getUserTickets = async (userId: number, options: GetUserTicketsOptions = {}) => {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (status) {
        where.status = status;
    }

    const [tickets, total] = await Promise.all([
        prisma.supportTicket.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                description: true,
                source: true,
                status: true,
                priority: true,
                createdAt: true,
                updatedAt: true,
                resolvedAt: true,
            },
        }),
        prisma.supportTicket.count({ where }),
    ]);

    return {
        tickets,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

// ============================================================================
// ADMIN TICKET RETRIEVAL
// ============================================================================

interface GetAllTicketsOptions {
    page?: number;
    limit?: number;
    status?: string;
    priority?: string;
    source?: string;
    search?: string;
}

export const getAllTickets = async (options: GetAllTicketsOptions = {}) => {
    const { page = 1, limit = 20, status, priority, source, search } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
        where.status = status;
    }

    if (priority) {
        where.priority = priority;
    }

    if (source) {
        where.source = source;
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
        ];
    }

    const [tickets, total] = await Promise.all([
        prisma.supportTicket.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                resolver: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        }),
        prisma.supportTicket.count({ where }),
    ]);

    return {
        tickets,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
        },
    };
};

// ============================================================================
// SINGLE TICKET RETRIEVAL
// ============================================================================

export const getTicketById = async (ticketId: number) => {
    const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
            resolver: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    if (!ticket) {
        throw new Error('Ticket not found');
    }

    return ticket;
};

// ============================================================================
// ADMIN TICKET MANAGEMENT
// ============================================================================

interface UpdateTicketParams {
    status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    adminNotes?: string;
}

export const updateTicket = async (
    ticketId: number,
    adminId: number,
    updates: UpdateTicketParams
) => {
    const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
    });

    if (!ticket) {
        throw new Error('Ticket not found');
    }

    const updateData: any = { ...updates };

    // If resolving, set resolver and resolved time
    if (updates.status === 'RESOLVED' || updates.status === 'CLOSED') {
        updateData.resolvedBy = adminId;
        updateData.resolvedAt = new Date();
    }

    const updatedTicket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: updateData,
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
            resolver: {
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                },
            },
        },
    });

    return updatedTicket;
};

// ============================================================================
// TICKET STATISTICS (For Admin Dashboard)
// ============================================================================

export const getTicketStats = async () => {
    const [
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        ticketsByPriority,
        ticketsBySource,
    ] = await Promise.all([
        prisma.supportTicket.count(),
        prisma.supportTicket.count({ where: { status: 'OPEN' } }),
        prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
        prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
        prisma.supportTicket.groupBy({
            by: ['priority'],
            _count: { priority: true },
        }),
        prisma.supportTicket.groupBy({
            by: ['source'],
            _count: { source: true },
        }),
    ]);

    const priorityBreakdown = ticketsByPriority.reduce((acc: Record<string, number>, item) => {
        acc[item.priority] = item._count.priority;
        return acc;
    }, {});

    const sourceBreakdown = ticketsBySource.reduce((acc: Record<string, number>, item) => {
        acc[item.source] = item._count.source;
        return acc;
    }, {});

    return {
        total: totalTickets,
        byStatus: {
            open: openTickets,
            inProgress: inProgressTickets,
            resolved: resolvedTickets,
            closed: closedTickets,
        },
        byPriority: priorityBreakdown,
        bySource: sourceBreakdown,
    };
};

// ============================================================================
// TICKET DELETION
// ============================================================================

/**
 * Delete a ticket by ID (Admin only - typically for resolved/closed tickets)
 */
export const deleteTicket = async (ticketId: number) => {
    const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
    });

    if (!ticket) {
        throw new Error('Ticket not found');
    }

    await prisma.supportTicket.delete({
        where: { id: ticketId },
    });

    return { success: true, deletedId: ticketId };
};

/**
 * Delete a user's own ticket (User can only delete their own tickets)
 */
export const deleteUserTicket = async (ticketId: number, userId: number) => {
    const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
    });

    if (!ticket) {
        throw new Error('Ticket not found');
    }

    if (ticket.userId !== userId) {
        throw new Error('Access denied');
    }

    await prisma.supportTicket.delete({
        where: { id: ticketId },
    });

    return { success: true, deletedId: ticketId };
};

