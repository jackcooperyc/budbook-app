import NewPostForm from '@/components/NewPostForm/NewPostForm';

export default function NewPostPage() {
  return (
    <div className="new-post-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">New post</h2>
          <p className="page-subtitle">Share session notes with friends and circles</p>
        </div>
      </header>
      <NewPostForm />
    </div>
  );
}
