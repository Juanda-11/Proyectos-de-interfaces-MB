'use strict';

const crypto = require('node:crypto');
const { getStore } = require('../store');

const MAX_PER_USER = 60;
const hashFor = (userId) => `notifications:${userId}`;

exports.add = async (userId, type, donation) => {
  if (!userId) return null;
  const notification = {
    id: crypto.randomUUID(),
    userId,
    type,
    donationId: donation.id,
    title: donation.title,
    createdAt: new Date().toISOString(),
    read: false,
  };
  await getStore().hset(hashFor(userId), notification.id, JSON.stringify(notification));
  return notification;
};

// Las más recientes primero; recorta las antiguas para no crecer sin límite.
exports.list = async (userId) => {
  const store = getStore();
  const all = Object.values(await store.hgetall(hashFor(userId)))
    .map((raw) => JSON.parse(raw))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  await Promise.all(all.slice(MAX_PER_USER).map((n) => store.hdel(hashFor(userId), n.id)));
  return all.slice(0, MAX_PER_USER);
};
