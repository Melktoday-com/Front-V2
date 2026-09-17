"use client";

import { chatService } from "@/services/chat.service";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

export const useConversations = () => {
    const { isLoggedIn } = useAuth();

    return useQuery({
        queryKey: ["conversations"],
        queryFn: () => chatService.listConversations(),
        enabled: isLoggedIn,
        refetchInterval: isLoggedIn ? 5000 : false,
    });
};

export const useConversation = (id?: string) => {
    const { isLoggedIn } = useAuth();

    return useQuery({
        queryKey: ["conversation", id],
        queryFn: () => chatService.listConversations().then(list => list.find(c => c.id === id)),
        enabled: isLoggedIn && !!id,
    });
};

export const useMessages = (conversationId?: string) => {
    const { isLoggedIn } = useAuth();

    return useInfiniteQuery({
        queryKey: ["messages", conversationId],
        queryFn: ({ pageParam }) =>
            chatService.getMessages(conversationId!, { lastMessageId: pageParam as string }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => {
            if (!lastPage || lastPage.length < 20) return undefined;
            return lastPage[lastPage.length - 1].id;
        },
        enabled: isLoggedIn && !!conversationId,
    });
};

export const useSendMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
            chatService.sendMessage(conversationId, { content }),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["messages", variables.conversationId] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
    });
};

export const useCreateConversation = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
        mutationFn: (dto: Parameters<typeof chatService.createConversation>[0]) =>
            chatService.createConversation(dto),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            router.push(`/profile/chat?id=${data.id}`);
        },
    });
};
