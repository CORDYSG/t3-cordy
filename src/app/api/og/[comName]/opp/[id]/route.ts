/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import React from "react";

export const runtime = "edge";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; comName: string }> },
) {
  try {
    const { id: oppId, comName } = await params;

    console.log("OG: Processing Opp ID:", oppId);

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

    // Fetch opportunity data
    const oppResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/internal/opp?id=${oppId}`,
      {
        headers: {
          "User-Agent": "NextJS-OG-Generator",
        },
      },
    );

    console.log("OG: Response status:", oppResponse.status);

    if (!oppResponse.ok) {
      console.log("OG: Opp fetch failed");
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
            "Opportunity Not Found",
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
            "The requested opportunity could not be loaded",
          ),
        ),
        {
          width: 1200,
          height: 630,
        },
      );
    }

    const opp = await oppResponse.json();
    console.log("OG: Opportunity data received:", !!opp?.thumbnail_url);

    if (!opp?.thumbnail_url) {
      console.log("OG: No thumbnail URL found");
      return new ImageResponse(
        React.createElement(
          "div",
          {
            style: {
              fontSize: 48,
              background: "linear-gradient(135deg, #ffa726 0%, #fb8c00 100%)",
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
            "⚠️",
          ),
          React.createElement(
            "h1",
            {
              style: { margin: 0, fontSize: 48, display: "flex" },
            },
            "Opportunity Incomplete",
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
            "Opportunity thumbnail is not available",
          ),
        ),
        {
          width: 1200,
          height: 630,
        },
      );
    }

    console.log(
      "OG: Generating image for opportunity with thumbnail:",
      opp.thumbnail_url,
    );

    // Main opportunity image - centered thumbnail on colored background
    return new ImageResponse(
      React.createElement(
        "div",
        {
          style: {
            width: "100%",
            height: "100%",
            background: "#FFF7E7", // Your primary red color - adjust as needed
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          },
        },
        // Centered thumbnail with rounded corners and shadow
        React.createElement(
          "div",
          {
            style: {
              width: "85%",
              height: "75%",
              borderRadius: "24px",
              overflow: "hidden",
              boxShadow: "0 10px 0px rgba(0, 0, 0, 1)",
              border: "4px solid rgba(0,0,0,1)",
              display: "flex",
            },
          },
          React.createElement("img", {
            src: opp.thumbnail_url,
            style: {
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            },
            alt: "Opportunity thumbnail",
          }),
        ),

        React.createElement(
          "div",
          {
            style: {
              position: "absolute",
              bottom: "10px",
              right: "5px",
              display: "flex",
              alignItems: "center",
              borderRadius: "12px",
              color: "white",
            },
          },
          React.createElement("img", {
            src: "https://images.ctfassets.net/ayry21z1dzn2/3a9exU2P1PQExcey0vmPYG/f96a45ddaea60bf022d01bea84cd1ed7/Group_196.png?h=250", // Replace with your actual logo URL
            style: {
              width: "530px",
              height: "330px",
              objectFit: "contain",
              objectPosition: "center",
            },
            alt: "Cordy Logo",
          }),
        ),
        // Brand logo placeholder in top right
        React.createElement(
          "div",
          {
            style: {
              position: "absolute",
              top: "20px",
              right: "0px",
              left: "50%",
              transform: "translateX(-50%)",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
          },
          React.createElement(
            "div",
            { style: { position: "relative", display: "flex" } },
            // Drop shadow layer
            React.createElement(
              "div",
              {
                style: {
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  fontSize: "128px",
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
                  fontSize: "128px",
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
        ),
        React.createElement(
          "div",
          {
            style: {
              position: "absolute",
              bottom: "30px",
              left: "10px",

              width: "200px",
              height: "50px",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
          },

          React.createElement("img", {
            src: "https://images.ctfassets.net/ayry21z1dzn2/2poqUSmRdtvVagWBmBWeku/5569a60db0db2ee99ef07c2cfe09a48a/CORDY_Icon_Rectangle.png?h=250", // Replace with your actual logo URL
            style: {
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
            },
            alt: "Cordy Logo",
          }),
        ),
        React.createElement(
          "div",
          {
            style: {
              position: "absolute",
              bottom: "10px",
              right: "0px",
              display: "flex",
              alignItems: "center",
              opacity: 0.8,
              borderRadius: "12px",
              padding: "12px 20px",
              color: "black",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                fontSize: "18px",
                fontWeight: "600",
                marginRight: "8px",
                display: "flex",
              },
            },
            `app.cordy.sg/c/${comName}`,
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
          "Failed to create opportunity image",
        ),
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  }
}
