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
  try {
    const { id: userId } = await params;
    
    console.log('OG: Processing user ID:', userId);
    
    // Fetch user data
    const userResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/internal/user?id=${userId}`,
      {
        headers: {
          'User-Agent': 'NextJS-OG-Generator',
        },
      }
    );
    
    console.log('OG: Response status:', userResponse.status);
    
    if (!userResponse.ok) {
      console.log('OG: User fetch failed');
      return new ImageResponse(
        React.createElement(
          'div',
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
            }
          },
          React.createElement('div', { 
            style: { fontSize: 64, marginBottom: 20 } 
          }, '❌'),
          React.createElement('h1', { 
            style: { margin: 0, fontSize: 48 } 
          }, 'User Not Found'),
          React.createElement('p', { 
            style: { margin: "10px 0 0 0", fontSize: 24, opacity: 0.9 } 
          }, 'The requested profile could not be loaded')
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    const user = await userResponse.json();
    console.log('OG: User data received:', !!user?.name);
    
    if (!user?.name) {
      console.log('OG: No user name found');
      return new ImageResponse(
        React.createElement(
          'div',
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
            }
          },
          React.createElement('div', { 
            style: { fontSize: 64, marginBottom: 20 } 
          }, '⚠️'),
          React.createElement('h1', { 
            style: { margin: 0, fontSize: 48 } 
          }, 'Profile Incomplete'),
          React.createElement('p', { 
            style: { margin: "10px 0 0 0", fontSize: 24, opacity: 0.9 } 
          }, 'User profile data is not available')
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    console.log('OG: Generating image for:', user.name);

    // Main profile image
    return new ImageResponse(
      React.createElement(
        'div',
        {
          style: {
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            padding: "60px",
            justifyContent: "space-between",
            color: "white",
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }
        },
        // Top content
        React.createElement(
          'div',
          {
            style: {
              display: "flex",
              flexDirection: "column",
            }
          },
          React.createElement('h1', { 
            style: { 
              fontSize: 72, 
              margin: 0,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.02em'
            } 
          }, user.name),
          user.email ? React.createElement('p', { 
            style: { 
              fontSize: 36, 
              margin: "24px 0 0 0",
              opacity: 0.9,
              fontWeight: 400,
            } 
          }, user.email) : null
        ),
        // Bottom branding
        React.createElement(
          'div',
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }
          },
          React.createElement('div', {
            style: {
              fontSize: 24,
              opacity: 0.8,
            }
          }, 'Profile'),
          React.createElement('div', {
            style: {
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "16px",
              padding: "16px 32px",
              fontSize: 28,
              fontWeight: 600,
              backdropFilter: "blur(10px)",
            }
          }, 'cordy.sg')
        )
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG: Error generating image:', error);
    
    return new ImageResponse(
      React.createElement(
        'div',
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
          }
        },
        React.createElement('div', { 
          style: { fontSize: 64, marginBottom: 20 } 
        }, '💥'),
        React.createElement('h1', { 
          style: { margin: 0, fontSize: 48 } 
        }, 'Generation Error'),
        React.createElement('p', { 
          style: { margin: "10px 0 0 0", fontSize: 24, opacity: 0.9 } 
        }, 'Failed to create profile image')
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}