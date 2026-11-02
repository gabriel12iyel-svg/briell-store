
import { getStore } from "@netlify/blobs";
import { randomUUID } from "node:crypto";

const store = getStore("briell-orders");

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store"
};

const statuses = [
  "pending",
  "paid",
  "processing",
  "completed",
  "cancelled"
];

export default async (req) => {
  try {
    if (req.method === "GET") {
      const result = await store.list();
      const orders = [];

      for (const item of result.blobs) {
        const order = await store.get(item.key, {
          type: "json"
        });

        if (order) orders.push(order);
      }

      orders.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      return new Response(
        JSON.stringify({
          success: true,
          orders
        }),
        { status: 200, headers }
      );
    }

    if (req.method === "POST") {
      const data = await req.json();

      if (!data.username ||
          typeof data.username !== "string" ||
          !Number.isFinite(Number(data.robux)) ||
          Number(data.robux) <= 0 ||
          !Number.isFinite(Number(data.amount)) ||
          Number(data.amount) <= 0) {
        return new Response(
          JSON.stringify({ error: "Data pesanan tidak valid" }),
          { status: 400, headers }
        );
      }

      const id = randomUUID();

      const order = {
        id,
        username: data.username.trim(),
        displayName: data.displayName || "",
        avatar: data.avatar || "",
        robux: Number(data.robux),
        amount: Number(data.amount),
        paymentMethod: data.paymentMethod || "",
        whatsapp: data.whatsapp || "",
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await store.setJSON(id, order);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Pesanan berhasil disimpan",
          order
        }),
        { status: 201, headers }
      );
    }

    if (req.method === "PATCH") {
      const data = await req.json();

      if (!data.id || !statuses.includes(data.status)) {
        return new Response(
          JSON.stringify({ error: "Status tidak valid" }),
          { status: 400, headers }
        );
      }

      const order = await store.get(data.id, {
        type: "json"
      });

      if (!order) {
        return new Response(
          JSON.stringify({ error: "Pesanan tidak ditemukan" }),
          { status: 404, headers }
        );
      }

      order.status = data.status;
      order.updatedAt = new Date().toISOString();

      await store.setJSON(data.id, order);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Status pesanan berhasil diperbarui",
          order
        }),
        { status: 200, headers }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers }
    );

  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({ error: "Terjadi kesalahan server" }),
      { status: 500, headers }
    );
  }
};
