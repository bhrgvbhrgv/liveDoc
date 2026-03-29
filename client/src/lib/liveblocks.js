import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = createClient({
    authEndpoint: async (room) => {
        const token = sessionStorage.getItem('token');
        if (!token) {
            throw new Error('Missing auth token for Liveblocks');
        }

        const response = await fetch(`${API_BASE_URL}/liveblocks-auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ room }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Liveblocks auth failed (${response.status}): ${errorBody}`);
        }

        return response.json();
    },
});

export const {
    RoomProvider,
    useRoom,
    useMyPresence,
    useOthers,
    useSelf,
    useStorage,
    useMutation,
} = createRoomContext(client);

export default client;
