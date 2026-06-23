"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UserAvatar } from "@/components/friends/user-avatar";

interface FriendUser {
  id: string;
  username: string;
  name: string | null;
  image: string | null;
}

interface Entry {
  id: string;
  friendUserId: string;
  position: number;
  friendUser: FriendUser;
}

interface FriendList {
  id: string;
  name: string;
  isDefault: boolean;
  entries: Entry[];
}

function SortableEntry({ entry, onRemove }: { entry: Entry; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-white/30 hover:text-white/60"
          aria-label="Drag to reorder"
        >
          ⠿
        </button>
        <UserAvatar name={entry.friendUser.name ?? entry.friendUser.username} image={entry.friendUser.image} size={32} />
        <div>
          <p className="text-sm font-medium">{entry.friendUser.name ?? entry.friendUser.username}</p>
          <p className="text-xs text-white/50">@{entry.friendUser.username}</p>
        </div>
      </div>
      <button onClick={() => onRemove(entry.id)} className="text-xs text-white/40 hover:text-red-300">
        Remove
      </button>
    </li>
  );
}

export default function TopFriendsPage() {
  const [lists, setLists] = useState<FriendList[]>([]);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [activeListId, setActiveListId] = useState<string>();
  const [newListName, setNewListName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const load = useCallback(async () => {
    const [listsRes, friendsRes] = await Promise.all([fetch("/api/friend-lists"), fetch("/api/friends")]);
    const listsJson = await listsRes.json();
    const friendsJson = await friendsRes.json();
    setLists(listsJson.lists ?? []);
    setFriends(friendsJson.friends ?? []);
    setActiveListId((current) => current ?? listsJson.lists?.[0]?.id);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeList = lists.find((l) => l.id === activeListId);

  async function createList() {
    if (!newListName.trim()) return;
    setError(undefined);
    const res = await fetch("/api/friend-lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newListName.trim() }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error);
      return;
    }
    setNewListName("");
    load();
  }

  async function deleteList(id: string) {
    await fetch(`/api/friend-lists/${id}`, { method: "DELETE" });
    if (activeListId === id) setActiveListId(undefined);
    load();
  }

  async function addEntry(friendUserId: string) {
    if (!activeList) return;
    setError(undefined);
    const res = await fetch(`/api/friend-lists/${activeList.id}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendUserId }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error);
      return;
    }
    load();
  }

  async function removeEntry(entryId: string) {
    if (!activeList) return;
    await fetch(`/api/friend-lists/${activeList.id}/entries/${entryId}`, { method: "DELETE" });
    load();
  }

  async function handleDragEnd(event: DragEndEvent) {
    if (!activeList) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = activeList.entries.findIndex((e) => e.id === active.id);
    const newIndex = activeList.entries.findIndex((e) => e.id === over.id);
    const reordered = arrayMove(activeList.entries, oldIndex, newIndex);

    setLists((prev) => prev.map((l) => (l.id === activeList.id ? { ...l, entries: reordered } : l)));

    await fetch(`/api/friend-lists/${activeList.id}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryIds: reordered.map((e) => e.id) }),
    });
  }

  if (loading) {
    return <p className="px-6 py-16 text-center text-white/60">Loading...</p>;
  }

  const availableFriends = activeList
    ? friends.filter((f) => !activeList.entries.some((e) => e.friendUserId === f.id))
    : [];

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Top Friends</h1>
        <Link href="/friends" className="text-sm text-violet-400 hover:underline">
          Back to friends
        </Link>
      </div>
      <p className="mt-1 text-sm text-white/60">Drag to rank. Create custom lists like Gaming Squad or Family.</p>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {lists.map((list) => (
          <button
            key={list.id}
            onClick={() => setActiveListId(list.id)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              activeListId === list.id ? "bg-violet-500" : "border border-white/15 hover:bg-white/5"
            }`}
          >
            {list.name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-white/10 bg-black/30 px-4 py-2 text-sm outline-none focus:border-violet-400/60"
          placeholder="New list name (e.g. Gaming Squad)"
          value={newListName}
          onChange={(e) => setNewListName(e.target.value)}
        />
        <button
          onClick={createList}
          className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium hover:bg-violet-400"
        >
          Create
        </button>
      </div>

      {activeList && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">{activeList.name}</h2>
            {!activeList.isDefault && (
              <button
                onClick={() => deleteList(activeList.id)}
                className="text-xs text-white/40 hover:text-red-300"
              >
                Delete list
              </button>
            )}
          </div>

          {activeList.entries.length === 0 ? (
            <p className="mt-4 text-sm text-white/40">No one here yet. Add friends below.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={activeList.entries.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="mt-4 space-y-2">
                  {activeList.entries.map((entry) => (
                    <SortableEntry key={entry.id} entry={entry} onRemove={removeEntry} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          {availableFriends.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-4">
              <h3 className="text-sm text-white/50">Add to this list</h3>
              <ul className="mt-2 space-y-2">
                {availableFriends.map((friend) => (
                  <li key={friend.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={friend.name ?? friend.username} size={28} />
                      <p className="text-sm">{friend.name ?? friend.username}</p>
                    </div>
                    <button
                      onClick={() => addEntry(friend.id)}
                      className="rounded-full border border-white/15 px-3 py-1 text-xs hover:bg-white/5"
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
