import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';

function VideoCard({ video, topicId, saved, onSave, onRemove }) {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors">
      {/* Thumbnail */}
      <a href={video.url} target="_blank" rel="noopener noreferrer" className="block relative">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full object-cover aspect-video"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg ml-1">▶</span>
          </div>
        </div>
      </a>

      {/* Info */}
      <div className="p-3">
        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium line-clamp-2 hover:text-primary-400 transition-colors leading-snug"
        >
          {video.title}
        </a>
        <p className="text-xs text-gray-400 mt-1">{video.channel}</p>

        <button
          onClick={() => saved ? onRemove(video.videoId) : onSave(video)}
          className={`mt-3 w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${
            saved
              ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }`}
        >
          {saved ? '✅ Saved — click to remove' : '+ Save resource'}
        </button>
      </div>
    </div>
  );
}

export default function YouTubeResources({ topic }) {
  const [searchQuery, setSearchQuery] = useState(`${topic.name} ${topic.subject}`);
  const [searched, setSearched] = useState(false);
  const qc = useQueryClient();

  const { data: searchResults, isLoading: searching, refetch } = useQuery({
    queryKey: ['yt-search', searchQuery, topic._id],
    queryFn: () => api.get('/youtube/search', { params: { query: topic.name, subject: topic.subject } }).then(r => r.data.videos),
    enabled: false,
  });

  const { data: savedData } = useQuery({
    queryKey: ['yt-saved', topic._id],
    queryFn: () => api.get(`/youtube/topic/${topic._id}`).then(r => r.data.resources),
  });

  const saved = savedData ?? [];

  const saveVideo = useMutation({
    mutationFn: (video) => api.post('/youtube/save', { topicId: topic._id, ...video }),
    onSuccess: () => qc.invalidateQueries(['yt-saved', topic._id]),
  });

  const removeVideo = useMutation({
    mutationFn: (videoId) => api.delete(`/youtube/topic/${topic._id}/${videoId}`),
    onSuccess: () => qc.invalidateQueries(['yt-saved', topic._id]),
  });

  const handleSearch = () => {
    setSearched(true);
    refetch();
  };

  const isSaved = (videoId) => saved.some(r => r.videoId === videoId);

  return (
    <div className="flex flex-col gap-5">
      {/* Search bar */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-500"
          placeholder="Search YouTube..."
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="btn-primary px-4 py-2 text-sm shrink-0"
        >
          {searching ? '...' : '🔍 Search'}
        </button>
      </div>

      {/* Saved resources */}
      {saved.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Saved resources</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {saved.map(video => (
              <VideoCard
                key={video.videoId}
                video={video}
                topicId={topic._id}
                saved={true}
                onSave={() => {}}
                onRemove={(id) => removeVideo.mutate(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search results */}
      {searched && (
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
            {searching ? 'Searching...' : `Results for "${searchQuery}"`}
          </p>
          {searching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-xl border border-gray-700 animate-pulse">
                  <div className="aspect-video bg-gray-700 rounded-t-xl" />
                  <div className="p-3 flex flex-col gap-2">
                    <div className="h-3 bg-gray-700 rounded w-full" />
                    <div className="h-3 bg-gray-700 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchResults?.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">No videos found. Try a different search.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {searchResults?.map(video => (
                <VideoCard
                  key={video.videoId}
                  video={video}
                  topicId={topic._id}
                  saved={isSaved(video.videoId)}
                  onSave={(v) => saveVideo.mutate(v)}
                  onRemove={(id) => removeVideo.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!searched && saved.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-3xl mb-2">🎬</p>
          <p className="text-sm">Search for YouTube videos related to this topic.</p>
        </div>
      )}
    </div>
  );
}