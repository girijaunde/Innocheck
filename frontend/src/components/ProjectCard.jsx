import React from 'react';

const ProjectCard = ({ project, onFork }) => {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{project.title}</h3>
          <p className="mt-1 text-xs text-gray-400">{project.description}</p>
        </div>
        <span className="rounded-full bg-blue-600 px-3 py-1 text-xs text-white">{project.framework}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(project.tags || []).map((tag) => (
          <span key={tag} className="rounded-full bg-gray-800 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-gray-400">
            {tag}
          </span>
        ))}
      </div>
      <button
        type="button"
        className="mt-4 w-full rounded-2xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        onClick={() => onFork(project.id)}
      >
        Fork Project
      </button>
    </div>
  );
};

export default ProjectCard;
