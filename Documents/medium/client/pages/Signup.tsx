"use client";
import axios from "axios";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LabelledInput } from "../components/LabeletInputs";
import { Button } from "../components/Button";
const BACKEND_URL = process.env.BACKENDURL;

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  return (
    <div className="h-screen flex justify-center flex-col">
      <div className="flex justify-center">
        <a
          href="#"
          className="block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 "
        >
          <div>
            <div className="px-10">
              <div className="text-3xl font-extrabold">Sign up</div>
            </div>
            <div className="pt-2">
              <LabelledInput
                onChange={(e) => {
                  setUsername(e.target.value);
                }}
                label="Username"
                placeholder="arnav@gmail.com"
              />
              <LabelledInput
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                label="Password"
                type={"password"}
                placeholder="123456"
              />
              <Button
                onClick={async () => {
                  await axios.post(`${BACKEND_URL}/user/signup}`, {
                    username,
                    password,
                  });
                  router.push("/");
                }}
                text="Sign up"
              />
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
