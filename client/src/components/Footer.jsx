export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900 py-4 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-gray-500">
          Built by <span className="text-primary-400 font-medium">Aditya Kamble</span>
        </p>

        <div className="flex items-center gap-4">
          <a
            href="mailto:your@email.com"
            className="text-xs text-gray-500 hover:text-primary-400 transition-colors"
          >
            📧 Email
          </a>

          <a
            href="https://github.com/your-username"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-primary-400 transition-colors"
          >
            🐙 GitHub
          </a>

          <a
            href="https://linkedin.com/in/your-linkedin"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-primary-400 transition-colors"
          >
            💼 LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}