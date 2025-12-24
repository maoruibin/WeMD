import { Header } from '../components/Header/Header';
import { showcaseUsers } from '../data/showcase';
import './ShowcasePage.css';
import { ExternalLink } from 'lucide-react';

export function ShowcasePage() {
  return (
    <div className="app">
      <Header />
      <main className="showcase-main">
        <div className="showcase-container">
          <div className="showcase-header">
            <h1 className="showcase-title">WeiMD 的朋友们</h1>
            <p className="showcase-slogan">
              与 <span className="highlight">{showcaseUsers.length}+</span> 位创作者一起，连接优秀内容，让 Markdown 赋予公众号排版更多可能。。
            </p>
          </div>

          <div className="showcase-grid">
            {showcaseUsers.map((user, index) => (
              <div key={index} className="showcase-card">
                <div className="card-content">
                  <div className="user-info">
                    <img src={user.avatar} alt={user.name} className="user-avatar" />
                    <div className="user-text">
                      <h3 className="user-name">{user.name}</h3>
                      <div className="user-tags">
                        {user.tags?.map((tag, i) => (
                          <span key={i} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="user-desc">{user.desc}</p>
                </div>
                
                {/* 悬浮显示的二维码 */}
                <div className="qrcode-overlay">
                  <div className="qrcode-box">
                    <img src={user.qrcode} alt={`${user.name}二维码`} />
                    <p>扫码关注</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="showcase-footer">
            <div className="join-us">
              <h2>申请收录</h2>
              <p>如果你也是 WeiMD 的用户，欢迎加入我们！</p>
              <a 
                href="https://ai.feishu.cn/share/base/form/shrcnLTgtUaA59NU9hAeMBLLpQd" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary join-btn"
              >
                填写飞书申请表 <ExternalLink size={16} style={{ marginLeft: 8 }} />
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
