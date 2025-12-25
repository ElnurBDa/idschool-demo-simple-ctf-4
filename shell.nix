{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  packages = with pkgs; [
	cewl
	thc-hydra
  ];

  shellHook = ''
    echo "✅ Development shell ready."
    '';
}
