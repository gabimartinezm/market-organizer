import React, { useState } from 'react';
import { ActivityLog, FamilyMember } from '../types';
import { Dialog } from './Dialog';
import { Copy, Check } from 'lucide-react';

interface ShareRoomModalProps {
  roomCode: string;
  onClose: () => void;
  activeUsers?: FamilyMember[];
}

export const ShareRoomModal: React.FC<ShareRoomModalProps> = ({
  roomCode,
  onClose,
  activeUsers = [],
}) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog
      title="Share this list"
      description="Anyone with the link can read and change the list."
      onClose={onClose}
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-1">
          <span className="eyebrow">Room code</span>
          <p className="font-mono text-h1 tracking-wider">{roomCode}</p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="share-url" className="eyebrow">
            Link
          </label>
          <div className="flex items-center gap-2">
            <input
              id="share-url"
              type="text"
              readOnly
              value={shareUrl}
              onFocus={(e) => e.currentTarget.select()}
              className="field font-mono text-data"
            />
            <button onClick={handleCopyLink} className="btn btn-action shrink-0">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {activeUsers.length > 0 && (
          <div className="flex flex-col gap-2 pt-1 border-t border-edge">
            <span className="eyebrow pt-3">Here now</span>
            <ul className="flex flex-wrap gap-1.5">
              {activeUsers.map((u) => (
                <li
                  key={u.id}
                  className="bg-surface-sunk text-ink-2 text-sm px-2.5 py-1 rounded-full"
                >
                  {u.name}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button onClick={onClose} className="btn btn-quiet w-full">
          Done
        </button>
      </div>
    </Dialog>
  );
};

interface ActivityModalProps {
  activity: ActivityLog[];
  onClose: () => void;
}

const ACTION_VERB: Record<ActivityLog['action'], string> = {
  add_weekly: 'added',
  remove_weekly: 'removed',
  create_item: 'created',
  mark_bought: 'picked up',
  mark_unbought: 'put back',
  update_qty: 'changed the quantity of',
  clear_bought: 'cleared',
  store_change: 'switched the store to',
  reorder_aisles: 'reordered the aisles for',
  edit_item: 'edited',
  delete_item: 'deleted',
};

export const ActivityModal: React.FC<ActivityModalProps> = ({ activity, onClose }) => {
  const formatTime = (ts: number) => {
    const min = Math.floor((Date.now() - ts) / 60000);
    if (min < 1) return 'now';
    if (min < 60) return `${min}m`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <Dialog
      title="Recent changes"
      description="The last 50 changes anyone made to this list."
      onClose={onClose}
      size="lg"
    >
      {activity.length === 0 ? (
        <p className="text-sm text-ink-3 text-center py-8">
          Nothing has changed yet. Edits from everyone in the room show up here.
        </p>
      ) : (
        <ul className="-my-2.5">
          {activity.map((log) => (
            <li
              key={log.id}
              className="flex items-baseline justify-between gap-3 py-2.5 border-b border-edge last:border-b-0"
            >
              <p className="text-sm min-w-0">
                <span className="font-medium">{log.userName}</span>
                <span className="text-ink-2"> {ACTION_VERB[log.action]} </span>
                {log.itemTitle && <span className="font-medium">{log.itemTitle}</span>}
                {log.details && <span className="text-ink-3"> — {log.details}</span>}
              </p>
              <span className="font-mono text-label text-ink-3 shrink-0">{formatTime(log.timestamp)}</span>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
};
