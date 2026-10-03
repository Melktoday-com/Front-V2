import { ticketingService } from "@/services/ticketing.service";
import {
    AddTicketReplyPayload,
    ChangeTicketStatusPayload,
    CreateTicketPayload,
    CreateTicketTopicPayload,
    ListAdminTicketsParams,
    ListTicketsParams,
    Ticket,
    TicketListResponse,
    TicketMessage,
    TicketMessageListResponse,
    TicketTopic,
    UpdateTicketTopicPayload,
} from "@/types/api/ticketing.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCookie } from "cookies-next";
import { useAuth } from "./useAuth";

const hasAuthToken = (): boolean =>
    typeof window !== "undefined" ? Boolean(getCookie("access_token")) : false;

// ── User Hooks ────────────────────────────────────────────────────────────────

export function useActiveTicketTopics() {
    const { isLoggedIn } = useAuth();

    return useQuery<TicketTopic[]>({
        queryKey: ["ticket-topics", "active"],
        queryFn: () => ticketingService.listActiveTopics(),
        enabled: isLoggedIn || hasAuthToken(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useMyTickets(params?: ListTicketsParams) {
    const { isLoggedIn } = useAuth();

    return useQuery<TicketListResponse>({
        queryKey: ["tickets", "my", params],
        queryFn: () => ticketingService.listMyTickets(params),
        enabled: isLoggedIn || hasAuthToken(),
        refetchInterval: 30 * 1000,
    });
}

export function useTicket(ticketId?: string) {
    const { isLoggedIn } = useAuth();

    return useQuery<Ticket>({
        queryKey: ["tickets", "detail", ticketId],
        queryFn: () => ticketingService.getTicket(ticketId!),
        enabled: Boolean((isLoggedIn || hasAuthToken()) && ticketId),
    });
}

export function useTicketMessages(ticketId?: string, params?: ListTicketsParams) {
    const { isLoggedIn } = useAuth();

    return useQuery<TicketMessageListResponse>({
        queryKey: ["tickets", "messages", ticketId, params],
        queryFn: () => ticketingService.getTicketMessages(ticketId!, params),
        enabled: Boolean((isLoggedIn || hasAuthToken()) && ticketId),
        refetchInterval: 10 * 1000,
    });
}

export function useCreateTicket() {
    const queryClient = useQueryClient();

    return useMutation<Ticket, Error, CreateTicketPayload>({
        mutationFn: (payload: CreateTicketPayload) =>
            ticketingService.createTicket(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tickets", "my"] });
        },
    });
}

export function useAddTicketReply(ticketId?: string) {
    const queryClient = useQueryClient();

    return useMutation<TicketMessage, Error, AddTicketReplyPayload>({
        mutationFn: (payload: AddTicketReplyPayload) => {
            if (!ticketId) throw new Error("Ticket ID is required to reply");
            return ticketingService.addReply(ticketId, payload);
        },
        onSuccess: () => {
            if (ticketId) {
                queryClient.invalidateQueries({
                    queryKey: ["tickets", "messages", ticketId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["tickets", "detail", ticketId],
                });
            }
            queryClient.invalidateQueries({ queryKey: ["tickets", "my"] });
        },
    });
}

// ── Admin Hooks ───────────────────────────────────────────────────────────────

export function useAdminTickets(params?: ListAdminTicketsParams, enabled = true) {
    return useQuery<TicketListResponse>({
        queryKey: ["admin-tickets", params],
        queryFn: () => ticketingService.listAdminTickets(params),
        enabled,
        refetchInterval: 15 * 1000,
    });
}

export function useAdminTicket(ticketId?: string, enabled = true) {
    return useQuery<Ticket>({
        queryKey: ["admin-tickets", "detail", ticketId],
        queryFn: () => ticketingService.getAdminTicket(ticketId!),
        enabled: Boolean(enabled && ticketId),
    });
}

export function useAdminTicketMessages(
    ticketId?: string,
    params?: ListTicketsParams,
    enabled = true
) {
    return useQuery<TicketMessageListResponse>({
        queryKey: ["admin-tickets", "messages", ticketId, params],
        queryFn: () => ticketingService.getAdminTicketMessages(ticketId!, params),
        enabled: Boolean(enabled && ticketId),
        refetchInterval: 10 * 1000,
    });
}

export function useAdminReplyTicket(ticketId?: string) {
    const queryClient = useQueryClient();

    return useMutation<TicketMessage, Error, AddTicketReplyPayload>({
        mutationFn: (payload: AddTicketReplyPayload) => {
            if (!ticketId) throw new Error("Ticket ID is required to reply");
            return ticketingService.adminReply(ticketId, payload);
        },
        onSuccess: () => {
            if (ticketId) {
                queryClient.invalidateQueries({
                    queryKey: ["admin-tickets", "messages", ticketId],
                });
                queryClient.invalidateQueries({
                    queryKey: ["admin-tickets", "detail", ticketId],
                });
            }
            queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
        },
    });
}

export function useAdminChangeTicketStatus(ticketId?: string) {
    const queryClient = useQueryClient();

    return useMutation<Ticket, Error, ChangeTicketStatusPayload>({
        mutationFn: (payload: ChangeTicketStatusPayload) => {
            if (!ticketId) throw new Error("Ticket ID is required to change status");
            return ticketingService.changeTicketStatus(ticketId, payload);
        },
        onSuccess: () => {
            if (ticketId) {
                queryClient.invalidateQueries({
                    queryKey: ["admin-tickets", "detail", ticketId],
                });
            }
            queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
        },
    });
}

// ── SuperAdmin Topic Hooks ────────────────────────────────────────────────────

export function useAllTicketTopics(enabled = true) {
    return useQuery<TicketTopic[]>({
        queryKey: ["admin-ticket-topics"],
        queryFn: () => ticketingService.listAllTopics(),
        enabled,
    });
}

export function useCreateTicketTopic() {
    const queryClient = useQueryClient();

    return useMutation<TicketTopic, Error, CreateTicketTopicPayload>({
        mutationFn: (payload: CreateTicketTopicPayload) =>
            ticketingService.createTopic(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-ticket-topics"] });
            queryClient.invalidateQueries({ queryKey: ["ticket-topics", "active"] });
        },
    });
}

export function useUpdateTicketTopic() {
    const queryClient = useQueryClient();

    return useMutation<
        TicketTopic,
        Error,
        { id: string; payload: UpdateTicketTopicPayload }
    >({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateTicketTopicPayload }) =>
            ticketingService.updateTopic(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-ticket-topics"] });
            queryClient.invalidateQueries({ queryKey: ["ticket-topics", "active"] });
        },
    });
}

export function useDeactivateTicketTopic() {
    const queryClient = useQueryClient();

    return useMutation<TicketTopic, Error, string>({
        mutationFn: (id: string) => ticketingService.deactivateTopic(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-ticket-topics"] });
            queryClient.invalidateQueries({ queryKey: ["ticket-topics", "active"] });
        },
    });
}

export function useActivateTicketTopic() {
    const queryClient = useQueryClient();

    return useMutation<TicketTopic, Error, string>({
        mutationFn: (id: string) => ticketingService.activateTopic(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-ticket-topics"] });
            queryClient.invalidateQueries({ queryKey: ["ticket-topics", "active"] });
        },
    });
}

export function useDeleteTicketTopic() {
    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
        mutationFn: (id: string) => ticketingService.deleteTopic(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-ticket-topics"] });
            queryClient.invalidateQueries({ queryKey: ["ticket-topics", "active"] });
        },
    });
}
