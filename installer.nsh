!macro customInstall
  ; Додаємо Melomaniac до шляху встановлення
  StrCpy $INSTDIR "$INSTDIR\Melomaniac"

  ; Перевіряємо, чи директорія існує, і створюємо її, якщо необхідно
  IfFileExists "$INSTDIR" "" createAppDir
  createAppDir:
    CreateDirectory "$INSTDIR"
!macroend