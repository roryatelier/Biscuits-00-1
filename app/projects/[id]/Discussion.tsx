'use client';

import { useState, useTransition } from 'react';
import { createComment, editComment, deleteComment } from '@/lib/actions/comments';
import { timeAgo } from '@/lib/utils/timeAgo';
import styles from './Collaboration.module.css';

type CommentData = {
  id: string;
  body: string;
  userId: string;
  parentId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string | null };
  replies: {
    id: string;
    body: string;
    userId: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    user: { id: string; name: string | null };
  }[];
};

interface Props {
  entityType: string;
  entityId: string;
  initialComments: CommentData[];
  currentUserId: string;
}

function isEdited(c: { createdAt: Date; updatedAt: Date }): boolean {
  return new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime() > 1000;
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onRefresh,
  isReply = false,
}: {
  comment: CommentData['replies'][number] & { replies?: CommentData['replies'] };
  currentUserId: string;
  onReply?: (parentId: string) => void;
  onRefresh: () => void;
  isReply?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [isPending, startTransition] = useTransition();
  const isOwn = comment.userId === currentUserId;
  const deleted = !!comment.deletedAt;

  async function handleSaveEdit() {
    const result = await editComment(comment.id, editBody);
    if (result.success) {
      setEditing(false);
      onRefresh();
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this comment?')) return;
    const result = await deleteComment(comment.id);
    if (result.success) onRefresh();
  }

  if (deleted) {
    return (
      <div className={`${styles.comment} ${isReply ? styles.reply : ''}`}>
        <p className={styles.deletedText}>This comment was deleted</p>
      </div>
    );
  }

  return (
    <div className={`${styles.comment} ${isReply ? styles.reply : ''}`}>
      <div className={styles.commentHeader}>
        <div className={styles.commentAvatar}>{(comment.user.name || '?').charAt(0).toUpperCase()}</div>
        <strong className={styles.commentAuthor}>{comment.user.name || 'Unknown'}</strong>
        <span className={styles.commentTime}>
          {timeAgo(comment.createdAt)}
          {isEdited(comment) && ' (edited)'}
        </span>
      </div>

      {editing ? (
        <div className={styles.editArea}>
          <textarea
            className={styles.commentInput}
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={2}
          />
          <div className={styles.editActions}>
            <button className={styles.btnSmall} onClick={handleSaveEdit} disabled={isPending}>Save</button>
            <button className={styles.btnSmallSecondary} onClick={() => { setEditing(false); setEditBody(comment.body); }}>Cancel</button>
          </div>
        </div>
      ) : (
        <p className={styles.commentBody}>{comment.body}</p>
      )}

      <div className={styles.commentActions}>
        {!isReply && onReply && (
          <button className={styles.commentActionBtn} onClick={() => onReply(comment.id)}>Reply</button>
        )}
        {isOwn && !editing && (
          <>
            <button className={styles.commentActionBtn} onClick={() => setEditing(true)}>Edit</button>
            <button className={styles.commentActionBtn} onClick={() => startTransition(handleDelete)}>Delete</button>
          </>
        )}
      </div>

      {/* Replies */}
      {'replies' in comment && comment.replies && comment.replies.length > 0 && (
        <div className={styles.repliesContainer}>
          {comment.replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              currentUserId={currentUserId}
              onRefresh={onRefresh}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Discussion({ entityType, entityId, initialComments, currentUserId }: Props) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [isPending, startTransition] = useTransition();

  // Top-level comments only (parentId is null)
  const topLevelComments = comments.filter(c => !c.parentId);

  async function refresh() {
    const { listComments } = await import('@/lib/actions/comments');
    const fresh = await listComments(entityType, entityId);
    setComments(fresh);
  }

  async function handlePost() {
    if (!body.trim()) return;
    const result = await createComment({ body, entityType, entityId });
    if (result.success) {
      setBody('');
      await refresh();
    }
  }

  async function handleReply() {
    if (!replyBody.trim() || !replyTo) return;
    const result = await createComment({ body: replyBody, entityType, entityId, parentId: replyTo });
    if (result.success) {
      setReplyTo(null);
      setReplyBody('');
      await refresh();
    }
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Discussion ({topLevelComments.length})</h2>
      </div>

      {topLevelComments.length === 0 ? (
        <p className={styles.emptyText}>No comments yet. Start the discussion.</p>
      ) : (
        <div className={styles.commentList}>
          {topLevelComments.map((c) => (
            <div key={c.id}>
              <CommentItem
                comment={c}
                currentUserId={currentUserId}
                onReply={(parentId) => { setReplyTo(parentId); setReplyBody(''); }}
                onRefresh={() => startTransition(refresh)}
              />
              {replyTo === c.id && (
                <div className={styles.replyInputArea}>
                  <textarea
                    className={styles.commentInput}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    autoFocus
                  />
                  <div className={styles.editActions}>
                    <button className={styles.btnSmall} onClick={() => startTransition(handleReply)} disabled={isPending}>Reply</button>
                    <button className={styles.btnSmallSecondary} onClick={() => setReplyTo(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New comment input */}
      <div className={styles.newCommentArea}>
        <textarea
          className={styles.commentInput}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a comment..."
          rows={2}
        />
        <button
          className={styles.postBtn}
          onClick={() => startTransition(handlePost)}
          disabled={isPending || !body.trim()}
        >
          {isPending ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}
