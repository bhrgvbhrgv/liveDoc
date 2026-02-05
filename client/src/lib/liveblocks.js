import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';

const client = createClient({
    authEndpoint: async (room) => {
        const token = sessionStorage.getItem('token');

        const response = await fetch('/api/liveblocks-auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ room }),
        });

        return await response.json();
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
