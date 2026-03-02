My Atlas:

<!DOCTYPE html>

<html lang="en"><head><link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Sonic Atlas - Deftones</title>
<!-- Load Tailwind CSS v3 with plugins -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Configure Tailwind to match specific colors and fonts -->
<script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'retro-gray': '#e6e6e6',
            'retro-orange': '#ff4500',
            'retro-black': '#000000',
          },
          fontFamily: {
            mono: ['"Courier New"', 'Courier', 'monospace'],
            retro: ['"VT323"', 'monospace'],
          },
          spacing: {
            '18': '4.5rem',
          }
        }
      }
    }
  </script>
<!-- Custom Styles for specific retro effects -->
<style data-purpose="retro-styling">
    /* Force monospace everywhere */
    body {
      font-family: 'Courier New', Courier, monospace;
      background-color: #e6e6e6;
      color: black;
      -webkit-font-smoothing: none;
    }

    /* Pixelated rendering */
    img {
      image-rendering: pixelated;
    }

    /* Border utilities */
    .border-dashed-black {
      border-bottom: 1px dashed black;
    }
    
    .border-solid-black {
      border: 1px solid black;
    }

    /* Custom scrollbar */
    ::-webkit-scrollbar {
      width: 12px;
    }
    ::-webkit-scrollbar-track {
      background: #e6e6e6;
      border-left: 1px solid black;
    }
    ::-webkit-scrollbar-thumb {
      background: #000;
      border: 2px solid #e6e6e6;
    }

    /* Vertical text for sidebar */
    .vertical-text {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      white-space: nowrap;
    }

    /* Retro orange square */
    .retro-square {
      width: 8px;
      height: 8px;
      background-color: #ff4500;
      border: 1px solid rgba(0,0,0,0.2);
    }
  </style>
<link href="https://fonts.googleapis.com/css2?family=VT323&amp;display=swap" rel="stylesheet"/></head>
<body class="h-screen w-full flex overflow-hidden selection:bg-retro-orange selection:text-white">
<!-- BEGIN: Sidebar -->
<aside class="w-20 flex-shrink-0 flex flex-col items-center border-r border-dashed border-black py-0 bg-[#e6e6e6] h-full overflow-y-auto z-10 relative">
<!-- Hamburger Menu & Vertical Title -->
<div class="flex flex-col items-center mb-8 gap-4 pt-4">
<!-- Hamburger Icon -->
<div class="flex flex-col gap-1.5 cursor-pointer hover:opacity-70">
<div class="w-6 h-0.5 bg-black"></div>
<div class="w-6 h-0.5 bg-black"></div>
<div class="w-6 h-0.5 bg-black"></div>
</div>
<!-- Vertical Text: MY ATLAS -->
<h1 class="vertical-text text-3xl font-retro tracking-widest mt-6 select-none">MY ATLAS</h1>
<!-- Decorative Bar -->
<div class="w-1.5 h-8 bg-black mt-2"></div>
</div>
<!-- Navigation List (Artists) -->
<nav class="flex flex-col gap-6 w-full px-1 items-center">
<!-- Active Item: Deftones -->
<div class="flex flex-col items-center group cursor-pointer relative">
<!-- Active Indicator -->
<div class="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#ff4500] border border-black/50 shadow-inner"></div>
<div class="w-12 h-12 rounded-full overflow-hidden border border-black grayscale group-hover:grayscale-0 transition-all">
<img alt="Deftones" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeB9V4w8RLu7TGT5or6Cixnv4iLDrXIjctS2cw9xcDOsHS5-l1w-b1FlAgDFbNXBNcJcWM8aitOfRfofOW669CEzXfoQEQUQzdnLwVuoPRQoapLi0EjHv6LlJtYuvyAsmcZQibVcW1Ba4RHTo_RjofGnJBavw-FKws0Ht_ms_Lqu1DoIHjJ47voPg2y3TnlXHOHQEg2_er8Gxoa7-ldyyKQ_4Mc6ZhmEpV83Ba2Yj-IKq-HWhP8TVoONPk67Vai5uXqA7h9kN6OzI"/>
</div>
<div class="text-[10px] text-center mt-1 font-bold leading-tight">Deftones</div>
</div>
<!-- Item: The Smashing Pumpkins -->
<div class="flex flex-col items-center group cursor-pointer relative">
<div class="w-10 h-10 rounded-full overflow-hidden border border-black grayscale hover:grayscale-0 transition-all">
<img alt="The Smashing Pumpkins" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeB9V4w8RLu7TGT5or6Cixnv4iLDrXIjctS2cw9xcDOsHS5-l1w-b1FlAgDFbNXBNcJcWM8aitOfRfofOW669CEzXfoQEQUQzdnLwVuoPRQoapLi0EjHv6LlJtYuvyAsmcZQibVcW1Ba4RHTo_RjofGnJBavw-FKws0Ht_ms_Lqu1DoIHjJ47voPg2y3TnlXHOHQEg2_er8Gxoa7-ldyyKQ_4Mc6ZhmEpV83Ba2Yj-IKq-HWhP8TVoONPk67Vai5uXqA7h9kN6OzI"/>
</div>
<div class="text-[10px] text-center mt-1 leading-tight">The Smashing<br/>Pumpkins</div>
</div>
<!-- Item: Nirvana -->
<div class="flex flex-col items-center group cursor-pointer relative">
<div class="w-10 h-10 rounded-full overflow-hidden border border-black grayscale hover:grayscale-0 transition-all">
<img alt="Nirvana" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeB9V4w8RLu7TGT5or6Cixnv4iLDrXIjctS2cw9xcDOsHS5-l1w-b1FlAgDFbNXBNcJcWM8aitOfRfofOW669CEzXfoQEQUQzdnLwVuoPRQoapLi0EjHv6LlJtYuvyAsmcZQibVcW1Ba4RHTo_RjofGnJBavw-FKws0Ht_ms_Lqu1DoIHjJ47voPg2y3TnlXHOHQEg2_er8Gxoa7-ldyyKQ_4Mc6ZhmEpV83Ba2Yj-IKq-HWhP8TVoONPk67Vai5uXqA7h9kN6OzI"/>
</div>
<div class="text-[10px] text-center mt-1 leading-tight">Nirvana</div>
</div>
<!-- Item: The Strokes -->
<div class="flex flex-col items-center group cursor-pointer relative">
<div class="w-10 h-10 rounded-full overflow-hidden border border-black grayscale hover:grayscale-0 transition-all">
<img alt="The Strokes" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeB9V4w8RLu7TGT5or6Cixnv4iLDrXIjctS2cw9xcDOsHS5-l1w-b1FlAgDFbNXBNcJcWM8aitOfRfofOW669CEzXfoQEQUQzdnLwVuoPRQoapLi0EjHv6LlJtYuvyAsmcZQibVcW1Ba4RHTo_RjofGnJBavw-FKws0Ht_ms_Lqu1DoIHjJ47voPg2y3TnlXHOHQEg2_er8Gxoa7-ldyyKQ_4Mc6ZhmEpV83Ba2Yj-IKq-HWhP8TVoONPk67Vai5uXqA7h9kN6OzI"/>
</div>
<div class="text-[10px] text-center mt-1 leading-tight">The Strokes</div>
</div>
<!-- Item: Radiohead -->
<div class="flex flex-col items-center group cursor-pointer relative">
<div class="w-10 h-10 rounded-full overflow-hidden border border-black grayscale hover:grayscale-0 transition-all">
<img alt="Radiohead" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeB9V4w8RLu7TGT5or6Cixnv4iLDrXIjctS2cw9xcDOsHS5-l1w-b1FlAgDFbNXBNcJcWM8aitOfRfofOW669CEzXfoQEQUQzdnLwVuoPRQoapLi0EjHv6LlJtYuvyAsmcZQibVcW1Ba4RHTo_RjofGnJBavw-FKws0Ht_ms_Lqu1DoIHjJ47voPg2y3TnlXHOHQEg2_er8Gxoa7-ldyyKQ_4Mc6ZhmEpV83Ba2Yj-IKq-HWhP8TVoONPk67Vai5uXqA7h9kN6OzI"/>
</div>
<div class="text-[10px] text-center mt-1 leading-tight">Radiohead</div>
</div>
</nav>
</aside>
<!-- END: Sidebar -->
<!-- BEGIN: Main Content Area -->
<main class="flex-1 flex flex-col h-full overflow-hidden relative">
<!-- Top Bar -->
<header class="h-16 flex items-center px-6 border-b border-dashed border-black shrink-0">
<h2 class="text-4xl font-retro tracking-[0.1em] uppercase font-normal">SONIC ATLAS</h2>
</header>
<!-- Scrollable Content -->
<div class="flex-1 overflow-y-auto px-6 py-6 pb-20">
<!-- BEGIN: Artist Header Section -->
<section class="mb-6">
<div class="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
<!-- Big Pixelated Title -->
<h1 class="text-8xl md:text-[7rem] font-retro font-normal uppercase tracking-tighter leading-none mb-1">DEFTONES</h1>
<!-- Artist Meta Info -->
<div class="flex flex-col items-start gap-2 pt-2">
<div class="flex items-start gap-2">
<img alt="Deftones Band Photo" class="w-12 h-12 border border-black object-cover grayscale" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeB9V4w8RLu7TGT5or6Cixnv4iLDrXIjctS2cw9xcDOsHS5-l1w-b1FlAgDFbNXBNcJcWM8aitOfRfofOW669CEzXfoQEQUQzdnLwVuoPRQoapLi0EjHv6LlJtYuvyAsmcZQibVcW1Ba4RHTo_RjofGnJBavw-FKws0Ht_ms_Lqu1DoIHjJ47voPg2y3TnlXHOHQEg2_er8Gxoa7-ldyyKQ_4Mc6ZhmEpV83Ba2Yj-IKq-HWhP8TVoONPk67Vai5uXqA7h9kN6OzI"/>
<div class="flex flex-col">
<div class="flex flex-wrap gap-1 mb-1">
<span class="px-2 py-0.5 bg-white border border-black text-xs font-mono shadow-[2px_2px_0_0_black]">alternative</span>
<span class="px-2 py-0.5 bg-white border border-black text-xs font-mono shadow-[2px_2px_0_0_black]">metal</span>
<span class="px-2 py-0.5 bg-white border border-black text-xs font-mono shadow-[2px_2px_0_0_black]">nu-metal</span>
<span class="px-2 py-0.5 bg-white border border-black text-xs font-mono shadow-[2px_2px_0_0_black]">experimental</span>
</div>
<span class="text-sm font-bold">4161K listeners</span>
</div>
</div>
</div>
</div>
<!-- Action Bar: Play Top Track -->
<div class="w-full border-2 border-black bg-[#e0e0e0] h-[45px] flex items-center justify-center relative mb-4 hover:bg-white transition-colors cursor-pointer">
<div class="absolute left-3 w-2.5 h-2.5 bg-[#ff4500] border border-black/20 shadow-inner"></div>
<span class="text-xl font-retro uppercase tracking-wider">PLAY TOP TRACK</span>
</div>
<!-- Bio Text -->
<p class="text-sm md:text-base max-w-4xl leading-relaxed mb-4">
      American metal band from Sacramento, CA. Formed 1988. Chino Moreno (vocals), Stephen Carpenter (guitar), Frank Delgado (keys), Abe Cunningham (drums). High-precision, atmospheric soundscape.
    </p>
<!-- Divider Line -->
<div class="w-full border-2 border-black bg-[#e0e0e0] h-[45px] flex items-center justify-center relative mb-4 hover:bg-white transition-colors cursor-pointer">
<div class="absolute left-3 w-2.5 h-2.5 bg-[#ff4500] border border-black/20 shadow-inner"></div>
<span class="text-xl font-retro uppercase tracking-wider">PLAY TOP TRACK</span>
</div>
</section>
<!-- END: Artist Header Section -->
<!-- BEGIN: Discography & Similar Artists Headers -->
<!-- Discography Header (Collapsed view implied) -->
<div class="flex items-center justify-between py-2 border-b border-solid border-black mb-1 cursor-pointer hover:bg-black/5 px-1">
<h3 class="text-lg uppercase">DISCOGRAPHY &amp; TOP TRACKS</h3>
<!-- Expand Icon -->
<svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewbox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
<path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" stroke-linecap="square" stroke-linejoin="miter"></path>
</svg>
</div>
<!-- Similar Artists Header -->
<div class="flex items-center justify-between py-2 mb-4 px-1">
<h3 class="text-lg uppercase">SIMILAR ARTISTS</h3>
</div>
<!-- END: Discography & Similar Artists Headers -->
<!-- BEGIN: Similar Artists List -->
<section class="flex flex-col gap-0 border-t border-black">
<!-- Row 1: Team Sleep -->
<div class="flex flex-col md:flex-row md:items-center py-2 border-b border-dashed border-black hover:bg-white/40 gap-2 md:gap-4">
<div class="flex items-center gap-3 w-full md:w-1/4">
<img alt="Team Sleep" class="w-10 h-10 border border-black grayscale object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkg7quCzDJgcTKb6rt8nde2iqEVemkENQg2NFUP8r_RIqeANK04lK7iTzk9h03NPXFbGagPTWkrv2x44t03vViix3NTKx3-Rs58YJOEp9BkbQDZfOWYM1WnaeAS7smWW2IwO995AM1sjkmvEbpGd2UEsETMGdaDXcqUv4vZS4OFrQBFNyZ0XM0f9gSLQegqrOoM2u5xW4ospTXoozt06l2Z3rfkuSeSK3dYRs8vUXq2tN49C283PbqOUgvdmI1JcoFyvtu5vKFvtY"/>
<span class="text-lg truncate font-mono">Team Sleep</span>
</div>
<div class="flex gap-2 w-full md:w-1/4">
<span class="px-1 border border-black text-xs bg-white font-mono shadow-[1px_1px_0_0_black]">alternative</span>
<span class="px-1 border border-black text-xs bg-white font-mono shadow-[1px_1px_0_0_black]">electronic</span>
</div>
<div class="flex items-center gap-2 flex-1 w-full">
<div class="h-[12px] w-full border border-black relative bg-white">
<div class="absolute left-0 top-0 h-full bg-black w-[100%]"></div>
</div>
<span class="text-sm w-12 text-right font-mono">100%</span>
</div>
<div class="flex gap-2 shrink-0">
<button class="w-[30px] h-[30px] border border-black flex items-center justify-center hover:bg-black hover:text-white bg-white transition-colors">
<span class="material-symbols-outlined text-lg">play_arrow</span>
</button>
<button class="w-[30px] h-[30px] border border-black flex items-center justify-center hover:bg-black hover:text-white bg-white transition-colors">
<span class="material-symbols-outlined text-sm">favorite</span>
</button>
</div>
</div>
<!-- Row 2: Korn -->
<div class="flex flex-col md:flex-row md:items-center py-2 border-b border-dashed border-black hover:bg-white/40 gap-2 md:gap-4">
<div class="flex items-center gap-3 w-full md:w-1/4">
<img alt="Korn" class="w-10 h-10 border border-black grayscale object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkgaj-I89DdUk7bylqALIv7JfTn05PVqnBtpEgmJHwG5K2SIVrZsaZJlmC3PA59Q2dC257gxl5wTeDKABNTjNnLaCYnmWSzJ3_7CbP3M7ZSHvlaonEAaEfCTeXC1dh9NczqDuK8ye82Tuf-N3cwLoZ5e1ppNwPvSjkJE6W4sSlGlnGQWYbJIlxFXz9tvWwhe9PhuBVLhhGossSLGEMqZso-YEe028q_d9aj9gEK_TClqSz6sJJ7kM6CgERDCVyLuC57MGIMd_lw9c"/>
<span class="text-lg truncate font-mono">Korn</span>
</div>
<div class="flex gap-2 w-full md:w-1/4">
<span class="px-1 border border-black text-xs bg-white font-mono shadow-[1px_1px_0_0_black]">metal</span>
<span class="px-1 border border-black text-xs bg-white font-mono shadow-[1px_1px_0_0_black]">nu-metal</span>
</div>
<div class="flex items-center gap-2 flex-1 w-full">
<div class="h-[12px] w-full border border-black relative bg-white">
<div class="absolute left-0 top-0 h-full bg-black w-[47%]"></div>
</div>
<span class="text-sm w-12 text-right font-mono">47%</span>
</div>
<div class="flex gap-2 shrink-0">
<button class="w-[30px] h-[30px] border border-black flex items-center justify-center hover:bg-black hover:text-white bg-white transition-colors">
<span class="material-symbols-outlined text-lg">play_arrow</span>
</button>
<button class="w-[30px] h-[30px] border border-black flex items-center justify-center hover:bg-black hover:text-white bg-white transition-colors">
<span class="material-symbols-outlined text-sm">favorite</span>
</button>
</div>
</div>
<!-- Row 3: Loathe -->
<div class="flex flex-col md:flex-row md:items-center py-2 border-b border-dashed border-black hover:bg-white/40 gap-2 md:gap-4">
<div class="flex items-center gap-3 w-full md:w-1/4">
<img alt="Loathe" class="w-10 h-10 border border-black grayscale object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkg7quCzDJgcTKb6rt8nde2iqEVemkENQg2NFUP8r_RIqeANK04lK7iTzk9h03NPXFbGagPTWkrv2x44t03vViix3NTKx3-Rs58YJOEp9BkbQDZfOWYM1WnaeAS7smWW2IwO995AM1sjkmvEbpGd2UEsETMGdaDXcqUv4vZS4OFrQBFNyZ0XM0f9gSLQegqrOoM2u5xW4ospTXoozt06l2Z3rfkuSeSK3dYRs8vUXq2tN49C283PbqOUgvdmI1JcoFyvtu5vKFvtY"/>
<span class="text-lg truncate font-mono">Loathe</span>
</div>
<div class="flex gap-2 w-full md:w-1/4">
<span class="px-1 border border-black text-xs bg-white font-mono shadow-[1px_1px_0_0_black]">ambient</span>
<span class="px-1 border border-black text-xs bg-white font-mono shadow-[1px_1px_0_0_black]">metalcore</span>
</div>
<div class="flex items-center gap-2 flex-1 w-full">
<div class="h-[12px] w-full border border-black relative bg-white">
<div class="absolute left-0 top-0 h-full bg-black w-[45%]"></div>
</div>
<span class="text-sm w-12 text-right font-mono">45%</span>
</div>
<div class="flex gap-2 shrink-0">
<button class="w-[30px] h-[30px] border border-black flex items-center justify-center hover:bg-black hover:text-white bg-white transition-colors">
<span class="material-symbols-outlined text-lg">play_arrow</span>
</button>
<button class="w-[30px] h-[30px] border border-black flex items-center justify-center hover:bg-black hover:text-white bg-white transition-colors">
<span class="material-symbols-outlined text-sm">favorite</span>
</button>
</div>
</div>
<!-- Row 4: Chino Moreno -->
<div class="flex flex-col md:flex-row md:items-center py-2 border-b border-dashed border-black hover:bg-white/40 gap-2 md:gap-4">
<div class="flex items-center gap-3 w-full md:w-1/4">
<img alt="Chino Moreno" class="w-10 h-10 border border-black grayscale object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkgaj-I89DdUk7bylqALIv7JfTn05PVqnBtpEgmJHwG5K2SIVrZsaZJlmC3PA59Q2dC257gxl5wTeDKABNTjNnLaCYnmWSzJ3_7CbP3M7ZSHvlaonEAaEfCTeXC1dh9NczqDuK8ye82Tuf-N3cwLoZ5e1ppNwPvSjkJE6W4sSlGlnGQWYbJIlxFXz9tvWwhe9PhuBVLhhGossSLGEMqZso-YEe028q_d9aj9gEK_TClqSz6sJJ7kM6CgERDCVyLuC57MGIMd_lw9c"/>
<span class="text-lg truncate font-mono">Chino Moreno</span>
</div>
<div class="flex gap-2 w-full md:w-1/4">
<span class="px-1 border border-black text-xs bg-white font-mono shadow-[1px_1px_0_0_black]">alternative</span>
<span class="px-1 border border-black text-xs bg-white font-mono shadow-[1px_1px_0_0_black]">shoegaze</span>
</div>
<div class="flex items-center gap-2 flex-1 w-full">
<div class="h-[12px] w-full border border-black relative bg-white">
<div class="absolute left-0 top-0 h-full bg-black w-[42%]"></div>
</div>
<span class="text-sm w-12 text-right font-mono">42%</span>
</div>
<div class="flex gap-2 shrink-0">
<button class="w-[30px] h-[30px] border border-black flex items-center justify-center hover:bg-black hover:text-white bg-white transition-colors">
<span class="material-symbols-outlined text-lg">play_arrow</span>
</button>
<button class="w-[30px] h-[30px] border border-black flex items-center justify-center hover:bg-black hover:text-white bg-white transition-colors">
<span class="material-symbols-outlined text-sm">favorite</span>
</button>
</div>
</div>
<!-- Row 5: Fleshwater -->
<div class="flex flex-col md:flex-row md:items-center py-2 border-b border-dashed border-black hover:bg-white/40 gap-2 md:gap-4">
<div class="flex items-center gap-3 w-full md:w-1/4">
<img alt="Fleshwater" class="w-10 h-10 border border-black grayscale object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkg7quCzDJgcTKb6rt8nde2iqEVemkENQg2NFUP8r_RIqeANK04lK7iTzk9h03NPXFbGagPTWkrv2x44t03vViix3NTKx3-Rs58YJOEp9BkbQDZfOWYM1WnaeAS7smWW2IwO995AM1sjkmvEbpGd2UEsETMGdaDXcqUv4vZS4OFrQBFNyZ0XM0f9gSLQegqrOoM2u5xW4ospTXoozt06l2Z3rfkuSeSK3dYRs8vUXq2tN49C283PbqOUgvdmI1JcoFyvtu5vKFvtY"/>
<span class="text-lg truncate font-mono">Fleshwater</span>
</div>
<div class="flex gap-2 w-full md:w-1/4">
<span class="px-1 border border-black text-xs bg-white font-mono shadow-[1px_1px_0_0_black]">alternative</span>
<span class="px-1 border border-black text-xs bg-white font-mono shadow-[1px_1px_0_0_black]">shoegaze</span>
</div>
<div class="flex items-center gap-2 flex-1 w-full">
<div class="h-[12px] w-full border border-black relative bg-white">
<div class="absolute left-0 top-0 h-full bg-black w-[42%]"></div>
</div>
<span class="text-sm w-12 text-right font-mono">42%</span>
</div>
<div class="flex gap-2 shrink-0">
<button class="w-[30px] h-[30px] border border-black flex items-center justify-center hover:bg-black hover:text-white bg-white transition-colors">
<span class="material-symbols-outlined text-lg">play_arrow</span>
</button>
<button class="w-[30px] h-[30px] border border-black flex items-center justify-center hover:bg-black hover:text-white bg-white transition-colors">
<span class="material-symbols-outlined text-sm">favorite</span>
</button>
</div>
</div>
</section>
<!-- END: Similar Artists List -->
</div>
</main>
<!-- END: Main Content Area -->
</body></html>


--------


Artist Card (Genre Select)

<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Sonic Atlas - Bossa Nova</title>
<!-- Tailwind CSS v3 with plugins -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Custom Configuration for Tailwind -->
<script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            'mono': ['"Courier New"', 'Courier', 'monospace'],
            'sans': ['Helvetica', 'Arial', 'sans-serif'],
          },
          colors: {
            'sonic-border': '#ccc', 
            'sonic-orange': '#e07a5f', /* Updated orange color */
          },
          spacing: {
            'card-pad': '12px',
          }
        }
      }
    }
  </script>
<!-- Custom CSS for specific brutalist layout needs -->
<style data-purpose="layout-and-borders">
    /* 
      Grid styling to create the "spreadsheet" look with collapsing borders.
      We use a border on the container and then borders on individual cells
      to simulate the grid lines without double borders.
    */
    .grid-container {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      border-top: 1px solid #ccc;
      border-left: 1px solid #ccc;
      gap: 0; /* Ensure no gap */
    }

    @media (min-width: 640px) {
      .grid-container {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (min-width: 1024px) {
      .grid-container {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }

    .grid-item {
      border-right: 1px solid #ccc;
      border-bottom: 1px solid #ccc;
      background: white;
    }

    /* Enforce strict grayscale and styling on images */
    .artist-image {
      filter: grayscale(100%);
      width: 100%;
      aspect-ratio: 3 / 2; 
      object-fit: cover;
      object-position: center;
      display: block;
    }
  </style>
<style data-purpose="typography">
    body {
      -webkit-font-smoothing: antialiased;
    }
    .text-mono-custom {
      font-family: 'Courier New', Courier, monospace;
      letter-spacing: -0.02em;
    }
  </style>
</head>
<body class="bg-white text-black font-mono">
<!-- BEGIN: MainContainer -->
<!-- The main wrapper handles the overall width and alignment -->
<main class="w-full min-h-screen flex flex-col border-b border-sonic-border">
<!-- BEGIN: Header -->
<header class="w-full border-b border-sonic-border px-4 py-3 text-xs md:text-sm uppercase tracking-tight font-mono" data-purpose="breadcrumbs">
<nav><span>SONIC ATLAS</span><span class="mx-2">&gt;</span><span>GENRE</span><span class="mx-2">&gt;</span><span>BOSSA NOVA [0.00.00]</span><span class="ml-4">[GRID VIEW]</span></nav>
</header>
<!-- END: Header -->
<!-- BEGIN: SearchSection -->
<section class="w-full border-b border-sonic-border p-4" data-purpose="search-bar">
<!-- Simple bordered input -->
<input class="w-full border border-sonic-border p-2 text-sm font-mono focus:outline-none focus:border-black uppercase placeholder-gray-500 rounded-none" placeholder="SEARCH_INPUT" type="text"/>
</section>
<!-- END: SearchSection -->
<!-- BEGIN: ArtistGrid -->
<!-- 
      This section contains the 4-column grid. 
      We use a custom class .grid-container defined in <style> to handle the 
      specific border collapse requirements of a brutalist table layout.
    -->
<section class="grid-container w-full" data-purpose="artist-grid">
<!-- Card 1: Laufey -->
<article class="grid-item flex flex-col justify-between p-4">
<div class="mb-3">
<img alt="Laufey" class="artist-image" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNMD7OumiMLZ_f5jH7lYaxVbVa5jHTbS61sPGxa4Zrowzqd1uwsFtLoLNJ4DdlHw2s3AXlG6qg6EOih8d6XPej9EDwETkDvLOT8HrPBSaxJRf6wIOmd2IbjYM3pN5SDgZ1OBdTwX3UjJ9nr3eewzGzO7PhQiO9W2i_ZF9e2iZ3NLR2G-Ea0SllgXiK2Kojrxnr7r6pCNXHwP64chR24iY4x_ImRiySPNfKLd_6hG9iPKtEPYNEWUJBJH1_jN3KQyx2uXn1Sv8pR4g"/>
</div>
<div class="flex justify-between items-end text-sm mt-auto">
<span class="font-mono">Laufey</span>
<span class="text-sonic-orange font-bold text-lg leading-none">+</span>
</div>
</article>
<!-- Card 2: Gal Costa -->
<article class="grid-item flex flex-col justify-between p-4">
<div class="mb-3">
<img alt="Gal Costa" class="artist-image" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUnBAXO2YfmGNAPzpsBg2BUiDIr24NYNmmzL_Pc0Aw6IdO8gn_eeED6BvsZt554NKJ7AoiwMPbRadPUvTwMCJc9RY0zuhK-FAHY3upMmcMj8t9EC21UpeUJ5TLc4THU2A_oLTvphygYdRoXzsGzu_8EDwln5kBVtFQKVQy9mQMK2zUwZo9yWSQcR-0k_5Stv9Bmm2eaoGNUTr57UrNAWpC1QEv-nv-BMhZgSaBLQei3PLd5-I_0W5O-I3UKJaoi3Wh3H4uUjYetsA"/>
</div>
<div class="flex justify-between items-end text-sm mt-auto">
<span class="font-mono">Gal Costa</span>
<span class="text-sonic-orange font-bold text-lg leading-none">+</span>
</div>
</article>
<!-- Card 3: Antônio Carlos Jobim -->
<article class="grid-item flex flex-col justify-between p-4">
<div class="mb-3">
<img alt="Antônio Carlos Jobim" class="artist-image" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXbnrEejrX82MPB-18ndSk5CnkXOwHjAqPCwMGEKRp1IGu0uvcE3wIlRmAhtDKYmUhMU1KzcqepvcGg5cnfJS_kPmzzZX2KUCz4KQaVc-DfkzqM0-LqTcCObKIL1oaFu5kHlkCyRhwlaWGZo2ZCMZ9W53ELaV6ii3-rLtcp9G33FZKq0ojYM5p6iAGnPOqS0ihXJvXp4wM37TBzKjnbJS8PqtaHuFhpyKul7bS0UiyNeLcL4Be7fwu1lwoW44Ze4IcUxnKT0ANijk"/>
</div>
<div class="flex justify-between items-end text-sm mt-auto">
<span class="font-mono">Antônio Carlos Jobim</span>
<span class="text-sonic-orange font-bold text-lg leading-none">+</span>
</div>
</article>
<!-- Card 4: Lisa Ono -->
<article class="grid-item flex flex-col justify-between p-4">
<div class="mb-3">
<img alt="Lisa Ono" class="artist-image" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCTLTZ5guRH9H2Nf_7l_Ig_px9b3ZLDIJKSvJmPOLW9TFHGAbX8ei8uHMrqALlQXdBfgIrJq3rA8dOzW9W2jVofBvxkfBCRL8SCRYFoZbG3KkzGfGlWCyWILKhU6MNMfSQq0OYjPHkPyVwlCfKMTvpD2A8FPNY4VJrPy7WKcWKx5M32_MhSiUH-x0-C1ZmPd4EpxF9BRBlV97Vudj2jKbUY_3BUQDoVM5QBeQKhDuWGWBWITJAfbI-z3Kn2EKvw00PIFaac62Srh0s"/>
</div>
<div class="flex justify-between items-end text-sm mt-auto">
<span class="font-mono">小野リサ (Lisa Ono)</span>
<span class="text-sonic-orange font-bold text-lg leading-none">+</span>
</div>
</article>
<!-- Card 5: Toquinho -->
<article class="grid-item flex flex-col justify-between p-4">
<div class="mb-3">
<img alt="Toquinho" class="artist-image" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpz9iIYX1qLJAsawSbPuPh_NVWfV4oh914BSDdRLlw1QLA95Oe2DKl8YlxqH8IfHI-7K3JxrylCbSih2ELGMg4TtteqlvIZ5MHiX4xNRrrEPwBg5CcZwV8v_sqpiGK5pXqeJmVeZIWl5vd8MLocx1UGN_zLtoda-Ey_vjYiG1v9rbfN0XFb98bK2T8duiCkjRcV9oeyK_yxGn7K1V9WznPcpRXgDB-PqaIVlsbFkZVpb0K7MTsYaAV2YIG9Xb-jUCcqxxbIBLxmvU"/>
</div>
<div class="flex justify-between items-end text-sm mt-auto">
<span class="font-mono">Toquinho</span>
<span class="text-sonic-orange font-bold text-lg leading-none">+</span>
</div>
</article>
<!-- Card 6: Lamp -->
<article class="grid-item flex flex-col justify-between p-4">
<div class="mb-3">
<img alt="Lamp" class="artist-image" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXqByH8v1eVI_PoNZA4rSUv16Jg2SOXvm-80Nl9SHoUJJDGnooIGJJVudZY7rnBidXgNlqCAgGe-m8SLmGI759G7SeSOX7iEyvsLHrr5K_PrpcDzOuRbUn_Lpp6NN5xf4gYmpl2VzzdKHThoKaGvf7E2J9FebFNzlIudIqgtYIRGRIchhDdwzm6z_nW_FluHyCXWGoFMZNRcFEt4J4Qn4jNfu2_MVBCiuNw8ZZN9LcpVVYMp8Ioh5wcJDEC7H7odyjxKIRY16Ttew"/>
</div>
<div class="flex justify-between items-end text-sm mt-auto">
<span class="font-mono">Lamp</span>
<span class="text-sonic-orange font-bold text-lg leading-none">+</span>
</div>
</article>
<!-- Card 7: João Gilberto -->
<article class="grid-item flex flex-col justify-between p-4">
<div class="mb-3">
<img alt="João Gilberto" class="artist-image" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtjnV8wyVOKQZvLFR3LUT69g2MK3v3Z0QCBqCF-KxQTP3rtHpJH6hVPYFOFWVScSi-VHbare6vI4mX0FaICej-tzIMl1rt0CrUX4Q1NOnQZDsLowU7cCBNGdph88y386TMXK7Q3Fp8fgtABSl9J0hGsmb2KbR5RL1qB8xM-RSH3WmORLoqMkPI8GRXlXVim1Deopexs1pKzoArsoMR0uLp7BJAFickYODHeM3hCIT_33EA-89fFptGUooMe8CHrPIcSahPg_EW8zc"/>
</div>
<div class="flex justify-between items-end text-sm mt-auto">
<span class="font-mono">João Gilberto</span>
<span class="text-sonic-orange font-bold text-lg leading-none">+</span>
</div>
</article>
<!-- Card 8: Chico Buarque -->
<article class="grid-item flex flex-col justify-between p-4">
<div class="mb-3">
<img alt="Chico Buarque" class="artist-image" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA-senrTpSnnb9xNi615gJj7YWksY3mYOc8cfdKs0dkb53k2ztK8ccVHqxreEM8pGii9EXNNR2ABuxSfDCE3GmJMiP30-YMMPvu_-bUvFsRZdguEUYp6XTMoOvftmKvcjT4L0UyqLKybv0LBKccO5uDcxa8OOMvRMruVUc1D0xPWUx60hhKjvUHocbp-KsMbpUzAEbFEYHBP4e-mU9Tj2bLNAMqSSU-XsbxuYobI4uJiy4ao2j52wXPAOtOm3P0ur11qFQ4uxNavOQ"/>
</div>
<div class="flex justify-between items-end text-sm mt-auto">
<span class="font-mono">Chico Buarque</span>
<span class="text-sonic-orange font-bold text-lg leading-none">+</span>
</div>
</article>
<!-- Card 9: Elis Regina -->
<article class="grid-item flex flex-col justify-between p-4">
<div class="mb-3">
<img alt="Elis Regina" class="artist-image" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlpgIXMjLQ2ZAd5iR1KTG-fNbwRKDCWPhVG5sQU0M7u3chB_jT--CQYwwQCtcKNRjJ5-Gf-gU-boxN3Qyyy7ir7a6v9_PdiG0_AMXFZTv3SxARhDQcjVjtQwGX_xkwxPlu_NPcYn-3KjKoVmtvKpHsw1OWXItS2_ZsdfW0e_uzCfjGOiY2tsp3l3lLIcyrQerdsZHoHZVOGUsVSd3LGZjWkMWJJyaF0aEyxwozelntAu8ImV5TT6_MmlOj5JB4Ow_KE9F4HveFhYw"/>
</div>
<div class="flex justify-between items-end text-sm mt-auto">
<span class="font-mono">Elis Regina</span>
<span class="text-sonic-orange font-bold text-lg leading-none">+</span>
</div>
</article>
<!-- Card 10: Caetano Veloso -->
<article class="grid-item flex flex-col justify-between p-4">
<div class="mb-3">
<img alt="Caetano Veloso" class="artist-image" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDRw1USrsxEZkYeqa0dzy_6wiui9c9gLRJps-eUqnRZVUVcr92mFpj7cGclxAa9Hltfs8NXEn-MnDjFjEtogdExLlbsdadASMgOE6qYOYYxsQ7FcS9i68IdsMAhHe9ExmXwizky9UX4ew2f7FO6qU4yGRJ1Ix5bgkIc-rKQH_PDZ-8t0QlNyGVVS-zmYmo8mM9ZgHVAAIAGnpjIQ7yoybi7OXglNfBq0qzOvdgXhOUk_s93sXDb8aQcy9xwMnzQqvy4KI3rikdHN_U"/>
</div>
<div class="flex justify-between items-end text-sm mt-auto">
<span class="font-mono">Caetano Veloso</span>
<span class="text-sonic-orange font-bold text-lg leading-none">+</span>
</div>
</article>
<!-- Card 11: Stan Getz -->
<article class="grid-item flex flex-col justify-between p-4">
<div class="mb-3">
<img alt="Stan Getz" class="artist-image" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1n8gyAT2IZlfMtaIR1W2BPqUbCdrsLbX68fLfyijvI65ZAtsSmi07i5thViVDuSw2l9Yx7JsZKVn0Z0vreXoz0D5ZiyaK3SrDxKSZPrGQSLoX7s-UnH2m7mlBumRQ0IVzqD68kvavOh1Z6r0apLufiQCi_-pKdZASuI2OA04bQk5HIuktA6WtVmwmK26NlQf3CDPzflCn_rTQPzObT2a3kHP9f2jw0D8C_Gy8IT6r8gGNaTjOLear29l8Qg3VZF58ns1xHLd_cOE"/>
</div>
<div class="flex justify-between items-end text-sm mt-auto">
<span class="font-mono">Stan Getz</span>
<span class="text-sonic-orange font-bold text-lg leading-none">+</span>
</div>
</article>
<!-- Card 12: Astrud Gilberto -->
<article class="grid-item flex flex-col justify-between p-4">
<div class="mb-3">
<img alt="Astrud Gilberto" class="artist-image" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB14db62l5TCLd5zIaYOlI7Kv1ag0sQSzZp9-3DqnfyrOtTCNo0KUnFafhIx-XU652w5Ud_aawrGxfkubGciAcrMuXvAWhhT6Ys8PSiJsEmwGgURoJQUdbKZXaPgZqiH5rrNJ-TXIcVL9sQ1xM_vqt_CYbqdzUHLq9Vs0tupyAj6IwhmZuby8d7BPCU7W9jsP68wE59AcSs1jse5pMt4QiqSqdOr3hG-AVTPfQeMipYe0tP8rJMUe8RLp44ouNQO2MHuya1YoF5m0s"/>
</div>
<div class="flex justify-between items-end text-sm mt-auto">
<span class="font-mono">Astrud Gilberto</span>
<span class="text-sonic-orange font-bold text-lg leading-none">+</span>
</div>
</article>
</section>
<!-- END: ArtistGrid -->
</main>
<!-- END: MainContainer -->
</body></html>


--------


Artist Selection

<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Sonic Atlas: Engineering Search</title>
<!-- Tailwind CSS v3 with Plugins -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Google Fonts: Roboto Mono for that monospace aesthetic -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500;700&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind Configuration for Custom Theme Colors and Fonts -->
<script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'base-bg': '#1e1e1e',
            'base-text': '#f0f0f0',
            'accent-orange': '#ff5500',
            'border-white': '#ffffff',
          },
          fontFamily: {
            mono: ['"Roboto Mono"', 'Courier New', 'monospace'],
          },
          spacing: {
            '1px': '1px',
          }
        }
      }
    }
  </script>
<!-- Custom CSS for specific technical details not covered by Tailwind utilities -->
<style data-purpose="base-styles">
    /* Ensure the font is applied globally and box-sizing is correct */
    body {
      font-family: 'Roboto Mono', monospace;
      background-color: #1e1e1e;
      color: #f0f0f0;
      -webkit-font-smoothing: antialiased;
    }
    
    /* Remove default border radius for brutalist look */
    * {
      border-radius: 0 !important;
    }

    /* Custom Scrollbar for a more integrated look */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #1e1e1e; 
      border-left: 1px solid #333;
    }
    ::-webkit-scrollbar-thumb {
      background: #ff5500; 
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #cc4400; 
    }
  
    *,
    *:before,
    *:after {
      box-sizing: border-box;
    }</style>
<style data-purpose="utility-classes">
    /* Utility for absolute positioning overlays */
    .technical-overlay {
      background: rgba(255, 85, 0, 0.9);
      mix-blend-mode: multiply;
    }
    
    /* Grid gap fix for pixel perfection */
    .grid-gap-px {
      gap: 1px;
    }
  
    /* Add margin to artist names in grid */
    article[class*="group"] > div:last-child {
      margin-top: 5px;
    }</style>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/></head>
<body class="flex flex-col min-h-screen text-xs md:text-sm uppercase leading-tight tracking-wider" style="background-color: #1a1a1a; color: #ffffff; font-family: 'Roboto Mono', monospace;">
<!-- BEGIN: MainHeader -->
<!-- Top navigation bar with site title and status indicators -->
<header class="w-full border-b border-white bg-base-bg p-4 flex justify-between items-center sticky top-0 z-50 h-16" data-purpose="header">
<div class="font-bold text-lg tracking-widest text-accent-orange">
      SONIC ATLAS: ENGINEERING SEARCH
    </div>
<div class="text-right text-xs text-gray-400"><span class="text-white">SYSTEM_STATUS:</span> <span class="text-accent-orange animate-pulse">ACTIVE</span> <span class="mx-2 text-gray-600">|</span> <span class="text-white">ARTIST_ID:</span> 0982 <span class="mx-2 text-gray-600">|</span> <span class="text-white">DATA_POINT:</span> S12KB</div>
</header>
<!-- END: MainHeader -->
<!-- BEGIN: MainContent -->
<!-- The primary two-column layout wrapper -->
<main class="flex-grow flex flex-col md:flex-row w-full h-full relative" data-purpose="main-layout">
<!-- BEGIN: LeftPanel -->
<!-- Contains the featured album art and specific details -->
<section class="w-full md:w-[40%] border-b md:border-b-0 md:border-r border-white flex flex-col p-6" data-purpose="feature-panel"><!-- Blueprint Style Container -->
<div class="relative w-full aspect-square bg-[#f5f5f5] flex flex-col p-[20px] overflow-hidden mb-6">
<!-- Title moved inside -->
<h1 style="font-family: 'Roboto Mono', monospace; font-weight: 700; font-size: 28px; color: #111; margin: 0 0 20px 0; line-height: 1.2; text-align: left;">
        Radiohead:<br/>In Rainbows
    </h1>
<!-- Centered Album Art with Filters -->
<div class="flex-grow flex items-center justify-center relative">
<img alt="Radiohead Inspired Art" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAS3YQmuPWJ78KgzqW7EixOB-d9ob8boIuIWLv76NoiSn_Dq8723lFT2Vnz3IV9Mid8mZOtz0t15xUcCacM5HKQPvsY1V1oXxu2jAx3j3Avd15kf1y3DV59a-MJ8e8qW40wyLsWfd1bf5VMeDo8lOQmY3VfslcEcSZFBWBi6n4jFN1tDe4C1Lh61SdcVIVQppEFk2gJ4NTJBpr-HWzYLEmOVYlt33AGi2rdC6jKqmZxrt4zvcMLbxXo4qiJlJ81HaPcygEQCVmAgpA" style="width: 70%; margin-top: 20px; filter: grayscale(1) contrast(1.2); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);"/>
<!-- Orange Overlay Bar (Full Width of Container) -->
<div class="absolute w-full bg-accent-orange flex items-center justify-between px-2 overflow-hidden opacity-90" style="top: 60%; height: 40px; left: 0; width: 100%; color: black; font-size: 10px; padding: 0 10px;">
<span>010101010</span> <span style="letter-spacing: 2px;">||| || ||| |||| || |</span> <span>010101010</span>
</div>
</div>
</div>
<!-- Album Details (Preserved) -->
<div class="flex flex-col space-y-1 font-mono" style="font-size: 14px; color: #ccc; line-height: 1.5;">
<div>ALBUM_ID: RAINBOWS_2007</div>
<div>FREQUENCY_RANGE: 20HZ:20KHZ</div>
<div>PRESSING: 180G VINYL</div>
</div></section>
<!-- END: LeftPanel -->
<!-- BEGIN: RightPanel -->
<!-- Contains the grid of tracks and the frequency spectrum graph -->
<section class="w-full md:w-[60%] flex flex-col p-6 space-y-6" data-purpose="content-panel">
<!-- Grid Section Title -->
<div class="flex items-center space-x-2 mb-2">
<div class="w-2 h-2 bg-accent-orange"></div>
<h2 class="text-sm font-bold text-gray-400">SIMILAR_SIGNALS_DETECTED</h2>
</div>
<!-- BEGIN: TrackGrid -->
<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5" data-purpose="track-grid">
<!-- Item 1 -->
<article class="flex flex-col space-y-2 group cursor-pointer">
<div class="relative w-full aspect-square bg-gray-800 border border-gray-700 overflow-hidden">
<img alt="Burial" class="w-full h-full object-cover grayscale transition-all invert grayscale contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu6vShQ5iwCVKY9ZdoM2fAIWYce9KMWdt160xM8LDp6thK_2_ANPS-Nh44XINlDh9HLYDfByW6n6OTiwGY_O3d4YAPrvav87T8k90HM7NhBcXNEp737cHutQjs2k7pPx1jVU82UffzAoyP94rB5Kety92_JoaJIDuFLJcPOsuOwdzfb2sOzTc-EfdDPz-lwlX0zLLZ-YSMww3mqbmPpWYZIxOsTE48u1TT96wDXKlz4pPufl9jQuyYN2aiPsH01uMJHkVALiuYkTM"/>
<div class="absolute bottom-1 right-1 bg-accent-orange text-black flex items-center justify-center w-8 h-4 rounded-[10px]">
<span class="material-symbols-outlined text-[10px] font-bold">Burial</span>
</div>
</div>
<div class="text-[10px] truncate group-hover:text-accent-orange uppercase text-[12px] text-[#cccccc]">Burial</div>
</article>
<!-- Item 2 -->
<article class="flex flex-col space-y-2 group cursor-pointer">
<div class="relative w-full aspect-square bg-gray-800 border border-gray-700 overflow-hidden">
<img alt="Aphex Twin" class="w-full h-full object-cover grayscale transition-all invert grayscale contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu6vShQ5iwCVKY9ZdoM2fAIWYce9KMWdt160xM8LDp6thK_2_ANPS-Nh44XINlDh9HLYDfByW6n6OTiwGY_O3d4YAPrvav87T8k90HM7NhBcXNEp737cHutQjs2k7pPx1jVU82UffzAoyP94rB5Kety92_JoaJIDuFLJcPOsuOwdzfb2sOzTc-EfdDPz-lwlX0zLLZ-YSMww3mqbmPpWYZIxOsTE48u1TT96wDXKlz4pPufl9jQuyYN2aiPsH01uMJHkVALiuYkTM"/>
<div class="absolute bottom-1 right-1 bg-accent-orange text-black flex items-center justify-center w-8 h-4 rounded-[10px]">
<span class="material-symbols-outlined text-[10px] font-bold">Burial</span>
</div>
</div>
<div class="text-[10px] truncate group-hover:text-accent-orange uppercase text-[12px] text-[#cccccc]">Burial</div>
</article>
<!-- Item 3 -->
<article class="flex flex-col space-y-2 group cursor-pointer">
<div class="relative w-full aspect-square bg-gray-800 border border-gray-700 overflow-hidden">
<img alt="Four Tet" class="w-full h-full object-cover grayscale transition-all invert grayscale contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu6vShQ5iwCVKY9ZdoM2fAIWYce9KMWdt160xM8LDp6thK_2_ANPS-Nh44XINlDh9HLYDfByW6n6OTiwGY_O3d4YAPrvav87T8k90HM7NhBcXNEp737cHutQjs2k7pPx1jVU82UffzAoyP94rB5Kety92_JoaJIDuFLJcPOsuOwdzfb2sOzTc-EfdDPz-lwlX0zLLZ-YSMww3mqbmPpWYZIxOsTE48u1TT96wDXKlz4pPufl9jQuyYN2aiPsH01uMJHkVALiuYkTM"/>
<div class="absolute bottom-1 right-1 bg-accent-orange text-black flex items-center justify-center w-8 h-4 rounded-[10px]">
<span class="material-symbols-outlined text-[10px] font-bold">Burial</span>
</div>
</div>
<div class="text-[10px] truncate group-hover:text-accent-orange uppercase text-[12px] text-[#cccccc]">Burial</div>
</article>
<!-- Item 4 -->
<article class="flex flex-col space-y-2 group cursor-pointer">
<div class="relative w-full aspect-square bg-gray-800 border border-gray-700 overflow-hidden">
<img alt="Flying Lotus" class="w-full h-full object-cover grayscale transition-all invert grayscale contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu6vShQ5iwCVKY9ZdoM2fAIWYce9KMWdt160xM8LDp6thK_2_ANPS-Nh44XINlDh9HLYDfByW6n6OTiwGY_O3d4YAPrvav87T8k90HM7NhBcXNEp737cHutQjs2k7pPx1jVU82UffzAoyP94rB5Kety92_JoaJIDuFLJcPOsuOwdzfb2sOzTc-EfdDPz-lwlX0zLLZ-YSMww3mqbmPpWYZIxOsTE48u1TT96wDXKlz4pPufl9jQuyYN2aiPsH01uMJHkVALiuYkTM"/>
<div class="absolute bottom-1 right-1 bg-accent-orange text-black flex items-center justify-center w-8 h-4 rounded-[10px]">
<span class="material-symbols-outlined text-[10px] font-bold">Burial</span>
</div>
</div>
<div class="text-[10px] truncate group-hover:text-accent-orange uppercase text-[12px] text-[#cccccc]">Burial</div>
</article>
<!-- Item 5 -->
<article class="flex flex-col space-y-2 group cursor-pointer">
<div class="relative w-full aspect-square bg-gray-800 border border-gray-700 overflow-hidden">
<img alt="Boards of Canada" class="w-full h-full object-cover grayscale transition-all invert grayscale contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu6vShQ5iwCVKY9ZdoM2fAIWYce9KMWdt160xM8LDp6thK_2_ANPS-Nh44XINlDh9HLYDfByW6n6OTiwGY_O3d4YAPrvav87T8k90HM7NhBcXNEp737cHutQjs2k7pPx1jVU82UffzAoyP94rB5Kety92_JoaJIDuFLJcPOsuOwdzfb2sOzTc-EfdDPz-lwlX0zLLZ-YSMww3mqbmPpWYZIxOsTE48u1TT96wDXKlz4pPufl9jQuyYN2aiPsH01uMJHkVALiuYkTM"/>
<div class="absolute bottom-1 right-1 bg-accent-orange text-black flex items-center justify-center w-8 h-4 rounded-[10px]">
<span class="material-symbols-outlined text-[10px] font-bold">Burial</span>
</div>
</div>
<div class="text-[10px] truncate group-hover:text-accent-orange uppercase text-[12px] text-[#cccccc]">Burial</div>
</article>
<!-- Item 6 -->
<article class="flex flex-col space-y-2 group cursor-pointer">
<div class="relative w-full aspect-square bg-gray-800 border border-gray-700 overflow-hidden">
<img alt="Jon Hopkins" class="w-full h-full object-cover grayscale transition-all invert grayscale contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu6vShQ5iwCVKY9ZdoM2fAIWYce9KMWdt160xM8LDp6thK_2_ANPS-Nh44XINlDh9HLYDfByW6n6OTiwGY_O3d4YAPrvav87T8k90HM7NhBcXNEp737cHutQjs2k7pPx1jVU82UffzAoyP94rB5Kety92_JoaJIDuFLJcPOsuOwdzfb2sOzTc-EfdDPz-lwlX0zLLZ-YSMww3mqbmPpWYZIxOsTE48u1TT96wDXKlz4pPufl9jQuyYN2aiPsH01uMJHkVALiuYkTM"/>
<div class="absolute bottom-1 right-1 bg-accent-orange text-black flex items-center justify-center w-8 h-4 rounded-[10px]">
<span class="material-symbols-outlined text-[10px] font-bold">Burial</span>
</div>
</div>
<div class="text-[10px] truncate group-hover:text-accent-orange uppercase text-[12px] text-[#cccccc]">Burial</div>
</article>
<!-- Item 7 -->
<article class="flex flex-col space-y-2 group cursor-pointer">
<div class="relative w-full aspect-square bg-gray-800 border border-gray-700 overflow-hidden">
<img alt="Mount Kimbie" class="w-full h-full object-cover grayscale transition-all invert grayscale contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu6vShQ5iwCVKY9ZdoM2fAIWYce9KMWdt160xM8LDp6thK_2_ANPS-Nh44XINlDh9HLYDfByW6n6OTiwGY_O3d4YAPrvav87T8k90HM7NhBcXNEp737cHutQjs2k7pPx1jVU82UffzAoyP94rB5Kety92_JoaJIDuFLJcPOsuOwdzfb2sOzTc-EfdDPz-lwlX0zLLZ-YSMww3mqbmPpWYZIxOsTE48u1TT96wDXKlz4pPufl9jQuyYN2aiPsH01uMJHkVALiuYkTM"/>
<div class="absolute bottom-1 right-1 bg-accent-orange text-black flex items-center justify-center w-8 h-4 rounded-[10px]">
<span class="material-symbols-outlined text-[10px] font-bold">Burial</span>
</div>
</div>
<div class="text-[10px] truncate group-hover:text-accent-orange uppercase text-[12px] text-[#cccccc]">Burial</div>
</article>
<!-- Item 8 -->
<article class="flex flex-col space-y-2 group cursor-pointer">
<div class="relative w-full aspect-square bg-gray-800 border border-gray-700 overflow-hidden">
<img alt="Floating Points" class="w-full h-full object-cover grayscale transition-all invert grayscale contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu6vShQ5iwCVKY9ZdoM2fAIWYce9KMWdt160xM8LDp6thK_2_ANPS-Nh44XINlDh9HLYDfByW6n6OTiwGY_O3d4YAPrvav87T8k90HM7NhBcXNEp737cHutQjs2k7pPx1jVU82UffzAoyP94rB5Kety92_JoaJIDuFLJcPOsuOwdzfb2sOzTc-EfdDPz-lwlX0zLLZ-YSMww3mqbmPpWYZIxOsTE48u1TT96wDXKlz4pPufl9jQuyYN2aiPsH01uMJHkVALiuYkTM"/>
<div class="absolute bottom-1 right-1 bg-accent-orange text-black flex items-center justify-center w-8 h-4 rounded-[10px]">
<span class="material-symbols-outlined text-[10px] font-bold">Burial</span>
</div>
</div>
<div class="text-[10px] truncate group-hover:text-accent-orange uppercase text-[12px] text-[#cccccc]">Burial</div>
</article>
<!-- Item 9 -->
<article class="flex flex-col space-y-2 group cursor-pointer">
<div class="relative w-full aspect-square bg-gray-800 border border-gray-700 overflow-hidden">
<img alt="Caribou" class="w-full h-full object-cover grayscale transition-all invert grayscale contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu6vShQ5iwCVKY9ZdoM2fAIWYce9KMWdt160xM8LDp6thK_2_ANPS-Nh44XINlDh9HLYDfByW6n6OTiwGY_O3d4YAPrvav87T8k90HM7NhBcXNEp737cHutQjs2k7pPx1jVU82UffzAoyP94rB5Kety92_JoaJIDuFLJcPOsuOwdzfb2sOzTc-EfdDPz-lwlX0zLLZ-YSMww3mqbmPpWYZIxOsTE48u1TT96wDXKlz4pPufl9jQuyYN2aiPsH01uMJHkVALiuYkTM"/>
<div class="absolute bottom-1 right-1 bg-accent-orange text-black flex items-center justify-center w-8 h-4 rounded-[10px]">
<span class="material-symbols-outlined text-[10px] font-bold">Burial</span>
</div>
</div>
<div class="text-[10px] truncate group-hover:text-accent-orange uppercase text-[12px] text-[#cccccc]">Burial</div>
</article>
<!-- Item 10 -->
<article class="flex flex-col space-y-2 group cursor-pointer">
<div class="relative w-full aspect-square bg-gray-800 border border-gray-700 overflow-hidden">
<img alt="Burial" class="w-full h-full object-cover grayscale transition-all invert grayscale contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu6vShQ5iwCVKY9ZdoM2fAIWYce9KMWdt160xM8LDp6thK_2_ANPS-Nh44XINlDh9HLYDfByW6n6OTiwGY_O3d4YAPrvav87T8k90HM7NhBcXNEp737cHutQjs2k7pPx1jVU82UffzAoyP94rB5Kety92_JoaJIDuFLJcPOsuOwdzfb2sOzTc-EfdDPz-lwlX0zLLZ-YSMww3mqbmPpWYZIxOsTE48u1TT96wDXKlz4pPufl9jQuyYN2aiPsH01uMJHkVALiuYkTM"/>
<div class="absolute bottom-1 right-1 bg-accent-orange text-black flex items-center justify-center w-8 h-4 rounded-[10px]">
<span class="material-symbols-outlined text-[10px] font-bold">Burial</span>
</div>
</div>
<div class="text-[10px] truncate group-hover:text-accent-orange uppercase text-[12px] text-[#cccccc]">Burial</div>
</article>
<!-- Item 11 -->
<article class="flex flex-col space-y-2 group cursor-pointer">
<div class="relative w-full aspect-square bg-gray-800 border border-gray-700 overflow-hidden">
<img alt="Aphex Twin" class="w-full h-full object-cover grayscale transition-all invert grayscale contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu6vShQ5iwCVKY9ZdoM2fAIWYce9KMWdt160xM8LDp6thK_2_ANPS-Nh44XINlDh9HLYDfByW6n6OTiwGY_O3d4YAPrvav87T8k90HM7NhBcXNEp737cHutQjs2k7pPx1jVU82UffzAoyP94rB5Kety92_JoaJIDuFLJcPOsuOwdzfb2sOzTc-EfdDPz-lwlX0zLLZ-YSMww3mqbmPpWYZIxOsTE48u1TT96wDXKlz4pPufl9jQuyYN2aiPsH01uMJHkVALiuYkTM"/>
<div class="absolute bottom-1 right-1 bg-accent-orange text-black flex items-center justify-center w-8 h-4 rounded-[10px]">
<span class="material-symbols-outlined text-[10px] font-bold">Burial</span>
</div>
</div>
<div class="text-[10px] truncate group-hover:text-accent-orange uppercase text-[12px] text-[#cccccc]">Burial</div>
</article>
<!-- Item 12 -->
<article class="flex flex-col space-y-2 group cursor-pointer">
<div class="relative w-full aspect-square bg-gray-800 border border-gray-700 overflow-hidden">
<img alt="Four Tet" class="w-full h-full object-cover grayscale transition-all invert grayscale contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu6vShQ5iwCVKY9ZdoM2fAIWYce9KMWdt160xM8LDp6thK_2_ANPS-Nh44XINlDh9HLYDfByW6n6OTiwGY_O3d4YAPrvav87T8k90HM7NhBcXNEp737cHutQjs2k7pPx1jVU82UffzAoyP94rB5Kety92_JoaJIDuFLJcPOsuOwdzfb2sOzTc-EfdDPz-lwlX0zLLZ-YSMww3mqbmPpWYZIxOsTE48u1TT96wDXKlz4pPufl9jQuyYN2aiPsH01uMJHkVALiuYkTM"/>
<div class="absolute bottom-1 right-1 bg-accent-orange text-black flex items-center justify-center w-8 h-4 rounded-[10px]">
<span class="material-symbols-outlined text-[10px] font-bold">Burial</span>
</div>
</div>
<div class="text-[10px] truncate group-hover:text-accent-orange uppercase text-[12px] text-[#cccccc]">Burial</div>
</article></div>
<!-- END: TrackGrid -->
<div class="border-t border-gray-800 my-4 w-full h-px"></div>
<!-- BEGIN: GraphSection -->
<div class="flex flex-col flex-grow min-h-[250px]" data-purpose="graph-section"><div class="flex items-end mb-2">
<h2 class="text-sm font-bold uppercase text-white" style="font-size: 14px; letter-spacing: 1px; color: #fff; margin-bottom: 10px;">
    FREQUENCY SPECTRUM
  </h2>
</div>
<!-- Graph Container -->
<div class="relative w-full h-full flex-grow border border-gray-700 bg-black overflow-hidden p-4" style="border-left: 1px solid #444; border-bottom: 1px solid #444;">
<!-- Scatter Plot Image -->
<img alt="Frequency Spectrum Graph" class="relative z-10 w-full h-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUK-umD8zddC3Uo_27oWj-eFGy6IIT2R5TLFHE259974w_CTKpLOOvYRpWA7AXq9U4LKOSXWORxKVrzllpreOybTlGsp1WyVWLDNnTQ44e7NULftihyeg1-Uy7_x0jy3qpcXw-fVBkyTObz34VscgTpP5Tfz6MARhIQEdsnJuaZhpe9yYE1rptXMEHAKhOt-7YjP0t2oW55dBnECzexMApcY6cAneSce2wm9rnBlUOmUV_WP8L0UzD6jZBOSaaYNP1tQsP0ZZPMXg" style="display: block;"/>
<!-- Technical Overlay on Graph -->
<div class="absolute -bottom-4 left-4 z-20 text-[9px] text-[#888888] font-bold">X: FREQUENCY (HZ)</div>
<div class="absolute top-10 -left-3 z-20 text-[9px] text-[#888888] font-bold transform -rotate-90 origin-top-left">Y: AMPLITUDE (DB)</div><div class="absolute inset-0 z-20 pointer-events-none" style="background-image: linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px); background-size: 20px 20px;"></div></div></div>
<!-- END: GraphSection -->
</section>
<!-- END: RightPanel -->
</main>
<!-- END: MainContent -->
<!-- BEGIN: MainFooter -->
<!-- Bottom navigation and build information -->
<footer class="w-full border-t border-white bg-base-bg p-4 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 z-50 h-auto md:h-12" data-purpose="footer"><nav class="flex space-x-2 mb-2 md:mb-0">
<a class="hover:text-accent-orange transition-colors" href="#">ENGINEERING</a>
<span class="text-gray-700">|</span>
<a class="text-white hover:text-accent-orange transition-colors" href="#">SEARCH</a>
<span class="text-gray-700">|</span>
<a class="hover:text-accent-orange transition-colors" href="#">SPECTRA</a>
<span class="text-gray-700">|</span>
<a class="hover:text-accent-orange transition-colors" href="#">ABOUT</a>
<span class="text-gray-700">|</span>
<a class="hover:text-accent-orange transition-colors" href="#">CONTACT</a>
</nav>
<div class="font-mono text-[10px] opacity-70 text-right">
<span class="text-gray-500">BUILD_VERSION:</span> 3.0.1B <span class="text-accent-orange mx-1">//</span>
<span class="text-gray-500">DATE:</span> 2024.05.27 <span class="text-accent-orange mx-1">//</span>
  TEENAGE ENGINEERING INSPIRED DESIGN
</div></footer>
<!-- END: MainFooter -->
</body></html>