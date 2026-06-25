"use client";

import useActiveChannel from "@/app/hooks/use-active-channel";
import useNotifications from "@/app/hooks/use-notifications";

const ActiveStatus = () => {
  useActiveChannel();
  useNotifications();

  return null;
};

export default ActiveStatus;