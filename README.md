# Portal da Vaquejada

Portal informativo responsivo sobre a história, a cultura, as competições e os resultados documentados da vaquejada brasileira.

## Executar localmente

As páginas carregam arquivos JSON por `fetch`, então não funcionam corretamente ao abrir `index.html` diretamente com `file://`. Na pasta do projeto, inicie um servidor estático:

```powershell
py -m http.server 8000
```

Se o comando `py` não estiver disponível, use:

```powershell
python -m http.server 8000
```

Abra `http://localhost:8000` no navegador. Não há dependências de build ou backend. Para encerrar o servidor, use `Ctrl+C` no terminal.

## Páginas

- `index.html`: apresentação, recorte do ranking, notícias e destaques.
- `historia.html`: contexto histórico, transformação esportiva e legislação.
- `competicoes.html`: calendário, resultados e filtros por temporada/competição.
- `ranking.html`: recorte por categoria do Ranking Nacional ABVAQ 2026.
- `campeoes.html`: perfis de conquistas documentadas, sem ranking histórico inventado.
- `cavalos.html`: registros de animais citados em resultados e no Hall da Fama.
- `fontes.html`: referências, datas, limites documentais e critérios editoriais.

## Dados e transparência

Os arquivos `data/*.json` estruturam rankings, competições, perfis e referências. A captura do Ranking Nacional ABVAQ foi consultada em 18/11/2026 às 15:06:32, e os demais dados foram consultados em 18/11/2026. São snapshots editoriais, sem atualização automática ou API. Confira sempre a publicação original e o regulamento vigente.

Não há ranking nacional unificado entre os diferentes circuitos. Campos de biografia, pontuação, linhagem, raça, registro ou fotografia que não foram confirmados ficam indisponíveis ou são omitidos. Fotografias de competidores e cavalos não foram copiadas quando não foi encontrada licença explícita; imagens de contexto são do Unsplash e não identificam pessoas ou animais.

## Tecnologias

HTML5 semântico, CSS3 responsivo e JavaScript sem dependências.
