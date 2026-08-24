import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

export default function BrandSection({
  title = 'Athenaeum Books',
  heading = 'Khám phá tri thức,',
  highlightText = 'nuôi dưỡng tâm hồn.',
  description = 'Hệ thống đọc và quản lý thư viện sách trực tuyến tối giản, tinh tế dành riêng cho những độc giả yêu quý từng trang sách.',
  quote = '“Một cuốn sách hay là một người bạn tri kỷ không bao giờ phản bội.”',
  author = '— Victor Hugo',
}) {
  return (
    <div className="client-auth-brand-side">
      <Link to="/" className="client-brand-header">
        <div className="client-brand-logo-icon">
          <BookOpen size={22} />
        </div>
        <span className="client-brand-title">{title}</span>
      </Link>

      <div className="client-brand-content">
        <h1 className="client-brand-heading">
          {heading} <span> {highlightText}</span>
        </h1>
        <p className="client-brand-desc">{description}</p>
      </div>

      <div className="client-brand-quote">
        <p>{quote}</p>
        <span>{author}</span>
      </div>
    </div>
  );
}
