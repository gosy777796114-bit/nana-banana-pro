import React from 'react';
import { ChevronDown, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIntegration } from '@/contexts/IntegrationContext';
import type { IntegrationData } from '@/types/integration';

export default function ConnectionSwitcher() {
  const { connections, activeConnection, activateConnection } = useIntegration();

  if (connections.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold font-arabic transition-all border cursor-pointer ${
            activeConnection
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
          }`}
        >
          {activeConnection ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          <span className="truncate max-w-[100px]">
            {activeConnection ? activeConnection.name : 'لا يوجد اتصال'}
          </span>
          <ChevronDown className="w-3 h-3 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="font-arabic min-w-[220px]" dir="rtl">
        <div className="px-2 py-1.5 text-[10px] text-muted-foreground font-arabic">
          بيانات الاتصال — {connections.length} متاح
        </div>
        <DropdownMenuSeparator />
        {connections.map((conn: IntegrationData) => {
          const isActive = activeConnection?.id === conn.id;
          return (
            <DropdownMenuItem
              key={conn.id}
              onClick={() => {
                if (!isActive) {
                  activateConnection(conn.id);
                }
              }}
              className={`flex items-center gap-2 py-2 cursor-pointer ${
                isActive ? 'bg-emerald-500/10' : ''
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isActive ? 'bg-emerald-400' : 'bg-muted-foreground/40'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate">{conn.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{conn.appId}</div>
              </div>
              {isActive && <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
