!macro customInstall
  StrCpy $INSTDIR "$INSTDIR\Melomaniac"
  IfFileExists "$INSTDIR" "" createAppDir
  createAppDir:
    CreateDirectory "$INSTDIR"
!macroend