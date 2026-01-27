import React from 'react';
import './LoadingShimmer.css';

export const LoadingShimmer = ({ width = '100%', height = '20px', className = '' }) => {
  return (
    <div 
      className={`loading-shimmer ${className}`}
      style={{ width, height }}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="card-skeleton">
      <LoadingShimmer width="60%" height="24px" />
      <LoadingShimmer width="100%" height="16px" className="mt-2" />
      <LoadingShimmer width="80%" height="16px" className="mt-1" />
    </div>
  );
};

export const TableSkeleton = ({ rows = 5 }) => {
  return (
    <div className="table-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="table-row-skeleton">
          <LoadingShimmer width="25%" height="16px" />
          <LoadingShimmer width="20%" height="16px" />
          <LoadingShimmer width="15%" height="16px" />
          <LoadingShimmer width="20%" height="16px" />
        </div>
      ))}
    </div>
  );
};
