interface CardFaceProps {
  name: string;
  icon: string;
  label: string;
}

/**
 * Conteúdo visual de um cartão (ícone, nome, estado e interruptor).
 * Partilhado pelo cartão real e pela pré-visualização do editor.
 * As cores vêm da variável CSS --c definida no elemento `.card` pai.
 */
export function CardFace({ name, icon, label }: CardFaceProps) {
  return (
    <>
      <span className="card-icon" aria-hidden="true">
        <span>{icon}</span>
      </span>
      <span className="card-name">{name}</span>
      <span className="card-foot">
        <span className="card-status">
          <i aria-hidden="true" />
          <span>{label}</span>
        </span>
        <span className="switch" aria-hidden="true">
          <i />
        </span>
      </span>
    </>
  );
}
