"use client";

import axios from "axios";
import type { FieldValues, SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { CldUploadButton } from "next-cloudinary";
import { HiPaperAirplane, HiPhoto } from "react-icons/hi2";
import { useCallback, useEffect, useRef, useState } from "react";

import useConversation from "@/app/hooks/use-conversation";
import MessageInput from "./message-input";

const TYPING_THROTTLE_MS = 2000;

const Form = () => {
  const { conversationId } = useConversation();
  const [isLoading, setIsLoading] = useState(true);
  const lastTypingSentRef = useRef(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      message: "",
    },
  });

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return;
    lastTypingSentRef.current = now;
    axios
      .post(`/api/conversations/${conversationId}/typing`)
      .catch(() => {
        // Typing pings are best-effort. Silent failure is fine.
      });
  }, [conversationId]);

  const message = watch("message");

  useEffect(() => {
    if (typeof message === "string" && message.trim().length > 0) {
      sendTyping();
    }
  }, [message, sendTyping]);

  if (isLoading) return null;

  const onSubmit: SubmitHandler<FieldValues> = (data) => {
    setValue("message", "", { shouldValidate: true });
    lastTypingSentRef.current = 0;
    axios.post("/api/messages", {
      ...data,
      conversationId,
    });
  };

  const handleUpload = (result: any) => {
    axios.post("/api/messages", {
      image: result?.info?.secure_url,
      conversationId,
    });
  };

  return (
    <div className="py-4 px-4 bg-white border-t flex items-center gap-2 lg:gap-4 w-full">
      <CldUploadButton
        options={{
          maxFiles: 1,
          maxFileSize: 4000000, // 4 mb
        }}
        onUpload={handleUpload}
        uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_PRESET}
      >
        <HiPhoto size={30} className="text-[#C9A84C]" />
      </CldUploadButton>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex items-center gap-2 lg:gap-4 w-full"
      >
        <MessageInput
          id="message"
          register={register}
          errors={errors}
          required
          placeholder="Écrire un message..."
        />

        <button
          type="submit"
          className="rounded-full p-2 bg-[#C9A84C] cursor-pointer hover:bg-[#9A6F14] transition"
        >
          <HiPaperAirplane size={18} className="text-white" />
        </button>
      </form>
    </div>
  );
};

export default Form;