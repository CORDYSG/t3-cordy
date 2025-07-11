/* eslint-disable */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import Image from "next/image";

// Mock Lottie Animation Component (replace with actual Lottie when available)

interface SwipeTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SwipeTutorialModal = ({ isOpen, onClose }: SwipeTutorialModalProps) => {
  // Import EmblaCarouselType if available, otherwise use 'any' as a fallback
  // import type { EmblaCarouselType } from 'embla-carousel-react';
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  const tutorialSlides = [
    {
      id: 1,
      animation:
        "https://images.ctfassets.net/ayry21z1dzn2/5TQ0UUHp4xru7Awb4zR4Wj/53df4d8020842ee883868623d8e1db13/18.svg",
      title: "Welcome to HOT or NOT!",
      description:
        "Swipe through curated opportunities and discover your passion!",
    },
    {
      id: 2,
      animation:
        "https://images.ctfassets.net/ayry21z1dzn2/ExbfvWedcLm8U6wlbTNhV/e364306280511973b82522ecf8e08bd5/16.svg",
      title: "Swipe Left",
      description:
        "If this opportunity doesn't interest you, swipe left on it. CORDY will remember your choice!.",
    },
    {
      id: 3,
      animation:
        "https://images.ctfassets.net/ayry21z1dzn2/18SP9obVE306AXsQBPxHLt/7a1bbd04f11fd5f22ac881f7035be040/19.svg",
      title: "Swipe Right",
      description:
        "If you like this opportunity, swipe right to save it for later. CORDY will keep track of your favorites!.",
    },
    {
      id: 4,
      animation:
        "https://images.ctfassets.net/ayry21z1dzn2/5q3Zd17GW5RnBsSI6Y3ZhT/de23b34bc8a13d4943af5ac14ea4a7bf/23.svg",
      title: "Tap to View Details",
      description:
        "Tap on the card to view more details about the opportunity!",
    },
  ];

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="flex flex-col justify-center overflow-hidden rounded-xl border-2 bg-white"
        style={{ boxShadow: "0px 4px 0px 0px rgba(0, 0, 0, 1)" }}
      >
        <DialogHeader>
          <DialogTitle className="text-center">
            Tutorial: HOT or NOT
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Carousel setApi={setApi} className="mx-auto w-full max-w-xs">
            <CarouselContent>
              {tutorialSlides.map((slide, index) => (
                <CarouselItem key={slide.id}>
                  <div className="mx-auto max-w-2xs text-center md:max-w-full">
                    {slide.animation && (
                      <div className="relative min-h-56 w-full">
                        <Image
                          src={slide.animation}
                          alt="Tutorial Animation"
                          className="absolute inset-0 h-full w-full object-cover"
                          height={300}
                          width={300}
                        />
                      </div>
                    )}

                    {/* Slide Content */}
                    <h3 className="font-brand my-3 text-2xl font-semibold text-gray-800">
                      {slide.title}
                    </h3>
                    <p className="leading-relaxed text-gray-600">
                      {slide.description}
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>

          {/* Slide Indicators */}
          <div className="mt-4 flex justify-center gap-2">
            {tutorialSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                  index === current - 1
                    ? "bg-blue-500"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>

          {/* Close Button */}
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleClose}
              className="btn-brand-primary font-brand shadow-brand px-8 font-bold text-black uppercase"
            >
              <span className="mt-0.5"> Got it!</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SwipeTutorialModal;
