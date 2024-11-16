!macro customPageInit
  StrCpy $INSTDIR "$INSTDIR\Melomaniac"
  
  GetDlgItem $R0 $HWNDPARENT 1203
  SendMessage $R0 ${WM_SETTEXT} 0 "STR:$INSTDIR"
!macroend
