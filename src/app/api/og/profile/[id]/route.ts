/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import React from "react";

export const runtime = "edge";



export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;

  const user = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/internal/user?id=${userId}`
  ).then((res) => res.json());

  if (!user?.name) {
    return new Response("User not found", { status: 404 });
  }

  return new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          fontSize: 40,
          background: "white",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "50px",
          justifyContent: "space-between",
        }
      },
      React.createElement(
        'div',
        null,
        React.createElement('h1', { style: { fontSize: 64 } }, user.name),
        React.createElement('p', { style: { fontSize: 32 } }, user.email)
      ),
      React.createElement('img', {
        src: "https://yourdomain.com/logo.svg",
        width: 120,
        alt: "Logo",
        style: { alignSelf: "flex-end" }
      })
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}