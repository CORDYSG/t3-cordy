import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Lock, ArrowRight } from "lucide-react";
import { FaDiscord, FaGoogle } from "react-icons/fa";
import { signIn } from "next-auth/react";
import Image from "next/image";
import confetti from "canvas-confetti";

type LoginPopupProps = {
  isLoginModalOpen: boolean;
  onCloseLoginModal: () => void;
};

const LoginPopup: React.FC<LoginPopupProps> = ({
  isLoginModalOpen,
  onCloseLoginModal,
}) => {
  useEffect(() => {
    if (isLoginModalOpen) {
      void confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isLoginModalOpen]);
  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="relative w-80 rounded-lg border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_#000]"
          >
            {/* Close Button */}
            <button
              onClick={onCloseLoginModal}
              className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-red-500 shadow-[4px_4px_0px_0px_#000] transition-all duration-100 hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#000]"
            >
              <X className="h-4 w-4 text-white" strokeWidth={3} />
            </button>

            {/* Content */}
            <div className="space-y-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <Image
                  src={
                    "https://images.ctfassets.net/ayry21z1dzn2/5driDo3RPyHVjnOZj2DztD/69ce15bd28db859c5c152fe09316a03e/Group_189.svg"
                  }
                  alt="CORDY Peeking"
                  width={170}
                  height={170}
                  className="mx-auto"
                />
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <h2 className="mb-1 text-2xl font-black tracking-wide text-black uppercase">
                  LOGIN to CORDY
                </h2>
                <p className="font-gray text-sm font-medium">
                  Get access to all our opportunities for free!
                </p>
                <div className="my-2 h-2 w-full border-2 border-black bg-yellow-400" />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <div className="relative">
                  <button
                    onClick={() => signIn("google")}
                    className="flex w-full cursor-pointer items-center justify-center gap-4 rounded-lg border-4 border-black bg-white py-3 font-bold text-black shadow-[4px_4px_0px_0px_black] transition-all hover:bg-gray-100"
                  >
                    <FaGoogle size={20} />
                    Sign in with Google
                  </button>
                </div>

                <div className="relative">
                  <button
                    onClick={() => signIn("discord")}
                    className="flex w-full cursor-pointer items-center justify-center gap-4 rounded-lg border-4 border-black bg-indigo-400 py-3 font-bold text-white shadow-[4px_4px_0px_0px_black] transition-all hover:bg-indigo-500"
                  >
                    <FaDiscord size={20} />
                    Sign in with Discord
                  </button>
                </div>

                {/* <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-2 border-4 border-black bg-green-500 px-4 py-3 font-black tracking-wide text-black uppercase shadow-[4px_4px_0px_0px_#000] transition-all duration-100 hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#000]"
                >
                  LET'S GO! <ArrowRight className="h-5 w-5" strokeWidth={3} />
                </motion.button> */}
              </motion.div>

              {/* <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", damping: 15 }}
                className="flex items-center justify-between pt-2"
              >
                <div className="rotate-2 border-2 border-black bg-pink-400 px-2 py-1 text-xs font-black uppercase">
                  POW!
                </div>
                <div className="-rotate-2 border-2 border-black bg-cyan-400 px-2 py-1 text-xs font-black uppercase">
                  BOOM!
                </div>
              </motion.div> */}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoginPopup;
