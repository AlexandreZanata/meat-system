# Como Ajustar o Tamanho do Ícone de Carne

O ícone de carne é uma imagem PNG que aparece quando o usuário **não está logado**.

## Localização do Código

O código está em: `public/app/app.js` na função `updateProfileButtonIcon()`

## Como Ajustar o Tamanho

No arquivo `public/app/app.js`, procure por esta linha (aproximadamente linha 499):

```javascript
icon.innerHTML = `<img src="/app/icons8-meat-50.png" alt="Carne" style="width: 24px; height: 24px; filter: brightness(0) invert(1); object-fit: contain;">`;
```

### Para aumentar o tamanho:
Altere `width: 24px; height: 24px;` para valores maiores, por exemplo:
- `width: 28px; height: 28px;` (um pouco maior)
- `width: 32px; height: 32px;` (maior ainda)
- `width: 36px; height: 36px;` (bem grande)

### Para diminuir o tamanho:
Altere para valores menores:
- `width: 20px; height: 20px;` (menor)
- `width: 18px; height: 18px;` (bem pequeno)

### Exemplo:
```javascript
// Ícone pequeno
icon.innerHTML = `<img src="/app/icons8-meat-50.png" alt="Carne" style="width: 20px; height: 20px; filter: brightness(0) invert(1); object-fit: contain;">`;

// Ícone médio (padrão)
icon.innerHTML = `<img src="/app/icons8-meat-50.png" alt="Carne" style="width: 24px; height: 24px; filter: brightness(0) invert(1); object-fit: contain;">`;

// Ícone grande
icon.innerHTML = `<img src="/app/icons8-meat-50.png" alt="Carne" style="width: 32px; height: 32px; filter: brightness(0) invert(1); object-fit: contain;">`;
```

## Outros Ajustes

### Mudar a cor:
O filtro `filter: brightness(0) invert(1);` deixa a imagem branca. Para outras cores:
- Remover o filtro: `filter: none;` (imagem original)
- Escurecer: `filter: brightness(0.5);`
- Ajustar opacidade: `opacity: 0.8;`

### Posicionamento:
O ícone está dentro do botão de perfil no header. Para ajustar a posição, edite o CSS em `public/app/style.css` na classe `.btn-profile`.

