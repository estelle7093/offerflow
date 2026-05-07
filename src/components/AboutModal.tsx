import React from 'react';
import { motion } from 'motion/react';
import { ICONS } from '../constants';

interface AboutModalProps {
  onClose: () => void;
}

export default function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
      >
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-error/10 rounded-[2.5rem] flex items-center justify-center mx-auto">
            <ICONS.Heart size={40} className="text-error" fill="currentColor" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-on-surface tracking-tight">开发者的初衷</h2>
            <p className="text-on-surface-variant text-xs opacity-60 font-bold tracking-widest uppercase">A message from developer</p>
          </div>

          <div className="bg-surface-container-low p-6 rounded-3xl relative">
            <ICONS.Quote size={20} className="absolute top-4 left-4 text-primary opacity-20" />
            <p className="text-on-surface text-sm font-bold leading-[1.8] text-justify">
              作者本人在求职记录过程中遇到的不便，因此萌生了做这样一款应用的灵感，希望能够帮助到更多的求职者！如果您觉得好用，也欢迎分享给您的家人朋友！
            </p>
            <ICONS.Quote size={20} className="absolute bottom-4 right-4 text-primary opacity-20 rotate-180" />
          </div>

          <div className="pt-4">
            <button 
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-on-surface text-white font-black hover:bg-on-surface-variant transition-all active:scale-95 shadow-lg shadow-on-surface/20"
            >
              收 到，谢 谢
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
