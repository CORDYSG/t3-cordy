/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import Image from "next/image";

export default function FeedbackForm() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

  const feedbackMutation = api.feedback.submit.useMutation({
    onSuccess: () => {
      toast.success("Feedback submitted successfully!");
      setMessage("");
      setEmail("");
      setImageFile(null);
    },
    onError: (error: any) => {
      if (error.data?.code === "UNAUTHORIZED") {
        toast.error("You must be logged in to submit feedback.");
      } else if (error.message.includes("Image too large")) {
        toast.error("Image size must be less than 5MB.");
      } else if (error.message.includes("Invalid email")) {
        toast.error("Please enter a valid email address.");
      } else if (error.message.includes("Message too short")) {
        toast.error("Message must be at least 5 characters long.");
      } else if (error.message.includes("Failed to upload image")) {
        toast.error("Failed to upload image. Please try again.");
      } else {
        toast.error("Failed to submit feedback. Please try again.");
      }
    },
  });

  //   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //     const file = e.target.files?.[0];
  //     if (!file) return;

  //     const validTypes = ["image/png", "image/jpeg"];
  //     const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

  //     if (!validTypes.includes(file.type)) {
  //       toast.error("Only PNG or JPG images are allowed.");
  //       return;
  //     }

  //     if (file.size > maxSizeInBytes) {
  //       toast.error("Image size must be less than 5MB.");
  //       return;
  //     }

  //     setImageFile(file);
  //   };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFeedbackLoading(true);

    try {
      // let imageBase64: string | null = null;

      // if (imageFile) {
      //   // Convert file to base64
      //   const buffer = await imageFile.arrayBuffer();
      //   imageBase64 = Buffer.from(buffer).toString("base64");
      // }

      await feedbackMutation.mutateAsync({
        message,
        email: email.trim() || undefined,
        // image: imageBase64,
        // imageType: imageFile
        //   ? (imageFile.type as "image/png" | "image/jpeg")
        //   : null,
        // fileName: imageFile ? imageFile.name : null,
      });
    } catch (err) {
      // Error handling is done in the mutation's onError callback
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex flex-col items-center justify-center gap-4 py-4">
      <div className="space-y-4">
        <h2 className="text-3xl font-black">Have something to tell us?</h2>
        <p className="font-medium text-slate-700">
          If you spot a glitch, or just want to let us know of an idea that
          would improve CORDY, just leave us a message!
        </p>
      </div>
      <Image
        src="https://images.ctfassets.net/ayry21z1dzn2/32YHSZ9oSk5VihRSmbniBK/1016aa9c64941b003164f225005d23c6/image_113.svg"
        alt="Cordy burning"
        height={250}
        width={300}
      />

      <form
        onSubmit={handleSubmit}
        className="shadow-brand w-full space-y-4 rounded-xl border-2 bg-white p-6 text-left md:w-2/3"
      >
        <div className="">
          <h4 className="text-left text-2xl font-black">Feedback Form</h4>
          <div className="my-4 w-full border-b-4 border-dashed" />
          <label className="block text-sm font-medium">Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Describe the glitch
          </label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded border px-3 py-2"
            rows={4}
            placeholder="e.g., The search page crashes when..."
            minLength={5}
          />
        </div>
        <p className="mt-4 text-sm text-gray-600">
          Or you can also email us at{" "}
          <a
            href={`mailto:kwdlajw@cordy.sg?subject=${encodeURIComponent(
              "Feedback for CORDY",
            )}&body=${encodeURIComponent(
              `Hi CORDY Team, I would like to share the following feedback: ${message}`,
            )}`}
            className="text-blue-600 underline"
          >
            team@cordy.sg
          </a>
          !
        </p>

        <button
          type="submit"
          className="btn-brand-primary mt-8 px-5"
          disabled={isFeedbackLoading}
        >
          {isFeedbackLoading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
