"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MaterialIcon from "./MaterialIcon";
import BrandIcon from "./BrandIcon";

interface Step {
  stepNumber: number;
  title: string;
  description: string;
}

interface BrewModeProps {
  steps: Step[];
  brewTimeSec: number;
  recipeName: string;
  onClose: () => void;
  onComplete: () => void;
}

export default function BrewMode({ steps, brewTimeSec, recipeName, onClose, onComplete }: BrewModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState(brewTimeSec);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = steps.length;
  const step = steps[currentStep];
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  const timerProgress = brewTimeSec > 0 ? ((brewTimeSec - timer) / brewTimeSec) * 100 : 0;

  useEffect(() => {
    if (running && timer > 0) {
      intervalRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            setRunning(false);
            // Vibrate on timer end
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, timer]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
      // Vibrate on step change
      if (navigator.vibrate) navigator.vibrate(100);
    } else {
      setCompleted(true);
      setRunning(false);
    }
  }, [currentStep, totalSteps]);

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const resetTimer = () => {
    setRunning(false);
    setTimer(brewTimeSec);
  };

  if (completed) {
    return (
      <div className="fixed inset-0 z-[200] bg-pine flex flex-col items-center justify-center text-paper p-8">
        <div className="text-center space-y-6">
          <div className="size-24 rounded-full bg-leaf/15 flex items-center justify-center mx-auto">
            <MaterialIcon icon="check_circle" className="text-6xl text-leaf" filled />
          </div>
          <h2 className="text-3xl font-bold">اكتمل التحضير!</h2>
          <p className="text-paper/60 text-lg">{recipeName}</p>
          <div className="flex gap-4 mt-8">
            <button
              onClick={onComplete}
              className="flex-1 bg-leaf text-pine font-bold py-4 rounded-2xl text-lg hover:opacity-90 transition-opacity"
            >
              سجّل هذا التحضير
            </button>
            <button
              onClick={onClose}
              className="px-6 py-4 rounded-2xl border border-paper/20 text-paper font-bold hover:bg-paper/10 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-pine flex flex-col text-paper">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-paper/10">
        <button onClick={onClose} aria-label="إغلاق وضع التحضير" className="size-10 rounded-full hover:bg-paper/10 flex items-center justify-center">
          <MaterialIcon icon="close" className="text-paper" />
        </button>
        <div className="text-center">
          <p className="text-xs text-paper/50 font-bold">وضع التحضير</p>
          <p className="text-sm font-medium text-paper/80">{recipeName}</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Step Progress Bar */}
      <div className="px-6 pt-4">
        <div className="flex items-center gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i <= currentStep ? "bg-leaf" : "bg-paper/20"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-paper/40 mt-2 text-center">
          الخطوة {currentStep + 1} من {totalSteps}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="size-16 rounded-2xl bg-leaf/15 flex items-center justify-center mb-6">
          <BrandIcon name="drop" className="text-3xl text-leaf" />
        </div>
        <h3 dir="auto" className="text-sm text-leaf font-bold mb-3">
          {step?.title || `الخطوة ${currentStep + 1}`}
        </h3>
        <p dir="auto" className="text-2xl font-semibold leading-loose max-w-md">
          {step?.description}
        </p>
      </div>

      {/* Timer Section */}
      <div className="px-6 pb-4">
        <div className="bg-paper/5 rounded-2xl p-6 border border-paper/10">
          <div className="text-center mb-4">
            <p className="font-display text-6xl tabular-nums">
              {formatTime(timer)}
            </p>
            <div className="w-full bg-paper/10 rounded-full h-1.5 mt-3">
              <div
                className="bg-leaf h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${timerProgress}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={resetTimer}
              aria-label="إعادة ضبط المؤقت"
              className="size-12 rounded-full border border-paper/20 flex items-center justify-center hover:bg-paper/10"
            >
              <MaterialIcon icon="restart_alt" className="text-paper/70" />
            </button>
            <button
              onClick={() => setRunning(!running)}
              aria-label={running ? "إيقاف مؤقت" : "تشغيل المؤقت"}
              className={`size-16 rounded-full flex items-center justify-center text-2xl ${
                running ? "bg-crema hover:bg-crema/85" : "bg-leaf hover:bg-leaf/80"
              } transition-colors`}
            >
              <MaterialIcon icon={running ? "pause" : "play_arrow"} className="text-pine" />
            </button>
            <button
              onClick={() => setTimer((t) => Math.max(0, t - 10))}
              aria-label="تقديم 10 ثوانٍ"
              className="size-12 rounded-full border border-paper/20 flex items-center justify-center hover:bg-paper/10"
            >
              <MaterialIcon icon="fast_forward" className="text-paper/70" />
            </button>
          </div>
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center gap-4 px-6 pb-8">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex-1 py-4 rounded-2xl border border-paper/20 font-bold text-paper disabled:opacity-30 hover:bg-paper/10 transition-colors"
        >
          السابق
        </button>
        <button
          onClick={nextStep}
          className="flex-1 py-4 rounded-2xl bg-leaf text-pine font-bold hover:opacity-90 transition-opacity"
        >
          {currentStep === totalSteps - 1 ? "إنهاء" : "الخطوة التالية"}
        </button>
      </div>
    </div>
  );
}
