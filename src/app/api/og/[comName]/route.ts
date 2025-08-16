/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import React from "react";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ comName: string }> },
) {
  try {
    const { comName } = await params;

    console.log("OG: Processing Com Name:", comName);

    // Check if community exists
    const oppResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/internal/community?comName=${comName}`,
      {
        headers: {
          "User-Agent": "NextJS-OG-Generator",
        },
      },
    );

    const [blackFont, boldFont, heavyFont] = await Promise.all([
      fetch(
        new URL("public/fonts/MohrRounded-Black.ttf", import.meta.url),
      ).then((res) => res.arrayBuffer()),
      fetch(new URL("public/fonts/MohrRounded-Bold.ttf", import.meta.url)).then(
        (res) => res.arrayBuffer(),
      ),
      fetch(
        new URL("public/fonts/MohrRounded-Heavy.ttf", import.meta.url),
      ).then((res) => res.arrayBuffer()),
    ]);
    console.log("OG: Response status:", oppResponse.status);

    if (!oppResponse.ok) {
      console.log("OG: Community fetch failed");
      return new ImageResponse(
        React.createElement(
          "div",
          {
            style: {
              fontSize: 48,
              background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              textAlign: "center",
            },
          },
          React.createElement(
            "div",
            {
              style: { fontSize: 64, marginBottom: 20, display: "flex" },
            },
            "❌",
          ),
          React.createElement(
            "h1",
            {
              style: { margin: 0, fontSize: 48, display: "flex" },
            },
            "Community Not Found",
          ),
          React.createElement(
            "p",
            {
              style: {
                margin: "10px 0 0 0",
                fontSize: 24,
                opacity: 0.9,
                display: "flex",
              },
            },
            "The requested community could not be loaded",
          ),
        ),
        {
          width: 1200,
          height: 630,
        },
      );
    }

    const community = await oppResponse.json();

    // Simple layout with background image as separate div and centered text
    return new ImageResponse(
      React.createElement(
        "div",
        {
          style: {
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            fontFamily: "system-ui, -apple-system, sans-serif",
            backgroundColor: "#f0f0f0", // fallback background
          },
        },

        // Background image div that fills the entire container
        React.createElement("img", {
          src: "https://images.ctfassets.net/ayry21z1dzn2/6hfRk1M0L8hRP8spb4IKW0/59a16d79dec9f8b11057db39adcc2753/wdawd.png",
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 1,
          },
        }),

        // Centered content container
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              zIndex: 2,
            },
          },

          // Community name with drop shadow effect
          React.createElement(
            "div",
            {
              style: {
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
            },
            // Drop shadow layer
            React.createElement(
              "div",
              {
                style: {
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  fontSize: "200px",
                  fontWeight: "900",
                  color: "black",
                  textTransform: "uppercase",
                  fontFamily: "MohrRounded, system-ui, sans-serif",
                  zIndex: 1,
                },
              },
              `${comName}`,
            ),
            // Main text with outline
            React.createElement(
              "div",
              {
                style: {
                  position: "relative",
                  fontSize: "200px",
                  fontWeight: "900",
                  color: "white",
                  WebkitTextStroke: "8px #000000",
                  textTransform: "uppercase",
                  fontFamily: "MohrRounded, system-ui, sans-serif",
                  zIndex: 2,
                },
              },
              `${comName}`,
            ),
          ),

          // Cordy logo centered below the text
          React.createElement(
            "div",
            {
              style: {
                width: "200px",
                height: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              },
            },
            React.createElement("img", {
              src: "https://images.ctfassets.net/ayry21z1dzn2/2poqUSmRdtvVagWBmBWeku/5569a60db0db2ee99ef07c2cfe09a48a/CORDY_Icon_Rectangle.png?h=250",
              style: {
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "center",
              },
              alt: "Cordy Logo",
            }),
          ),
        ),
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "MohrRounded",
            data: blackFont,
            style: "normal",
            weight: 800,
          },
          {
            name: "MohrRounded",
            data: boldFont,
            style: "normal",
            weight: 700,
          },
          {
            name: "MohrRounded",
            data: heavyFont,
            style: "normal",
            weight: 900,
          },
        ],
      },
    );
  } catch (error) {
    console.error("OG: Error generating image:", error);

    return new ImageResponse(
      React.createElement(
        "div",
        {
          style: {
            fontSize: 48,
            background: "#dc2626",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            textAlign: "center",
          },
        },
        React.createElement(
          "div",
          {
            style: { fontSize: 64, marginBottom: 20, display: "flex" },
          },
          "💥",
        ),
        React.createElement(
          "h1",
          {
            style: { margin: 0, fontSize: 48, display: "flex" },
          },
          "Generation Error",
        ),
        React.createElement(
          "p",
          {
            style: {
              margin: "10px 0 0 0",
              fontSize: 24,
              opacity: 0.9,
              display: "flex",
            },
          },
          "Failed to create community image",
        ),
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  }
}
